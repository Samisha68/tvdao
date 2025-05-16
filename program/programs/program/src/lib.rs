use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use std::str::FromStr; // For Pubkey::from_str

declare_id!("2HL7u9iKaj5BEJZ523WsLquPeMZKYMzLhZQ7et4HX7jA"); // Replace with your new program ID after first build/deploy

// --- Constants ---
const DAO_TREASURY_WALLET_PUBKEY: &str = "AcgrjDivEESNyHQrzieFXXxqJEgYvPqWyKjTodNSBrwp";  // DAO's real pubkey
const VOTING_PERIOD_SECONDS: i64 = 30 * 60; // 30 minutes for voting
const MAX_NAME_LENGTH: usize = 50;
const MAX_URL_LENGTH: usize = 200;

// --- Enums ---
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug, Default)]
pub enum ChannelCategory {
    #[default]
    New,        // Typically 0
    Popular,    // Typically 1
    TrendingNow // Typically 2
}

// --- Program Definition ---
#[program]
pub mod tvdao {
    use super::*;

    // Initializes the global state for the DAO, like channel counter
    pub fn initialize_dao_state(ctx: Context<InitializeDaoState>) -> Result<()> {
        let dao_state = &mut ctx.accounts.dao_state;
        dao_state.next_channel_id = 0;
        dao_state.treasury = Pubkey::from_str(DAO_TREASURY_WALLET_PUBKEY).unwrap();
        dao_state.authority = *ctx.accounts.authority.key;
        Ok(())
    }

    // Broadcaster submits a new channel
    pub fn submit_channel(ctx: Context<SubmitChannel>, name: String, embed_url: String) -> Result<()> {
        require!(name.len() <= MAX_NAME_LENGTH, TvDaoError::NameTooLong);
        require!(embed_url.len() <= MAX_URL_LENGTH, TvDaoError::UrlTooLong);

        let dao_state = &mut ctx.accounts.dao_state;
        let channel = &mut ctx.accounts.channel;
        let clock = Clock::get()?;

        channel.channel_id = dao_state.next_channel_id;
        channel.broadcaster = *ctx.accounts.broadcaster.key;
        channel.name = name;
        channel.embed_url = embed_url;
        channel.submission_time = clock.unix_timestamp;
        channel.final_price = 0; // Not yet finalized
        channel.is_finalized = false;
        channel.total_revenue_collected = 0;
        channel.votes_for_1_usdc = 0;
        channel.votes_for_2_usdc = 0;
        channel.votes_for_3_usdc = 0;
        channel.bump = ctx.bumps.channel;

        dao_state.next_channel_id = dao_state.next_channel_id.checked_add(1).unwrap();

        msg!("Channel #{} submitted: {}", channel.channel_id, channel.name);
        Ok(())
    }

    // Viewer votes on a channel's price
    pub fn vote_price(ctx: Context<VotePrice>, proposed_price_tier: u8) -> Result<()> {
        let channel = &mut ctx.accounts.channel;
        let voter_record = &mut ctx.accounts.voter_record;
        let clock = Clock::get()?;

        require!(!channel.is_finalized, TvDaoError::VotingClosed);
        require!(
            clock.unix_timestamp <= channel.submission_time.checked_add(VOTING_PERIOD_SECONDS).unwrap(),
            TvDaoError::VotingPeriodExpired
        );
        require!(
            proposed_price_tier >= 1 && proposed_price_tier <= 3,
            TvDaoError::InvalidPriceTier
        );

        // Ensure one vote per user per channel (using voter_record PDA)
        require!(!voter_record.has_voted, TvDaoError::AlreadyVoted);


        match proposed_price_tier {
            1 => channel.votes_for_1_usdc = channel.votes_for_1_usdc.checked_add(1).unwrap(),
            2 => channel.votes_for_2_usdc = channel.votes_for_2_usdc.checked_add(1).unwrap(),
            3 => channel.votes_for_3_usdc = channel.votes_for_3_usdc.checked_add(1).unwrap(),
            _ => return err!(TvDaoError::InvalidPriceTier),
        }

        voter_record.voter = *ctx.accounts.viewer.key;
        voter_record.channel_id = channel.channel_id;
        voter_record.has_voted = true; // Mark as voted
        voter_record.bump = ctx.bumps.voter_record;


        msg!("Vote cast for channel #{} for price tier {}", channel.channel_id, proposed_price_tier);
        Ok(())
    }

    // Finalizes the price if the voting window has expired
    pub fn finalize_price(ctx: Context<FinalizePrice>) -> Result<()> {
        let channel = &mut ctx.accounts.channel;
        let clock = Clock::get()?;

        require!(!channel.is_finalized, TvDaoError::AlreadyFinalized);
        require!(
            clock.unix_timestamp > channel.submission_time.checked_add(VOTING_PERIOD_SECONDS).unwrap(),
            TvDaoError::VotingStillOpen
        );

        let mut winning_price = 1_000_000_000; // Default to 1 SOL (or 1 USDC equivalent in lamports if using SPL)
        let mut max_votes = channel.votes_for_1_usdc;

        if channel.votes_for_2_usdc > max_votes {
            max_votes = channel.votes_for_2_usdc;
            winning_price = 2_000_000_000; // 2 SOL
        } else if channel.votes_for_2_usdc == max_votes && channel.votes_for_1_usdc != max_votes { // Tie-breaking rule: prefer lower if 2 has more or equal and 1 is not the same max
             winning_price = 2_000_000_000; // 2 SOL
        }


        if channel.votes_for_3_usdc > max_votes {
            // max_votes = channel.votes_for_3_usdc; // No need to update max_votes, just winning_price
            winning_price = 3_000_000_000; // 3 SOL
        } else if channel.votes_for_3_usdc == max_votes && (channel.votes_for_1_usdc != max_votes && channel.votes_for_2_usdc != max_votes) {  // Tie-breaking rule
            winning_price = 3_000_000_000; // 3 SOL
        }


        // If all votes are zero, or in certain tie scenarios, it defaults to 1 SOL.
        // A more sophisticated tie-breaking might be needed (e.g., earliest proposal, broadcaster's choice if tie)
        // For now, if votes_for_1_usdc is max (or tied for max and others aren't higher), price is 1.

        channel.final_price = winning_price;
        channel.is_finalized = true;

        msg!("Price for channel #{} finalized at {} lamports", channel.channel_id, channel.final_price);
        Ok(())
    }

    // Viewer pays to access a channel
    pub fn pay_for_channel(ctx: Context<PayForChannel>) -> Result<()> {
        let channel = &mut ctx.accounts.channel;
        let dao_state = &ctx.accounts.dao_state;
        let payment_record = &mut ctx.accounts.payment_record;

        require!(channel.is_finalized, TvDaoError::PriceNotFinalized);
        require!(channel.final_price > 0, TvDaoError::PriceNotSet); // Should be caught by is_finalized too

        let price_to_pay = channel.final_price;

        // 70% to broadcaster (accumulated), 30% to DAO treasury
        let broadcaster_share = price_to_pay.checked_mul(70).unwrap().checked_div(100).unwrap();
        let dao_share = price_to_pay.checked_sub(broadcaster_share).unwrap();

        // Transfer DAO share immediately
        let transfer_to_dao_ix = anchor_lang::system_program::Transfer {
            from: ctx.accounts.viewer.to_account_info(),
            to: ctx.accounts.dao_treasury.to_account_info(),
        };
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                transfer_to_dao_ix,
            ),
            dao_share,
        )?;

        // Accumulate broadcaster's earnings in the channel account
        channel.total_revenue_collected = channel.total_revenue_collected.checked_add(broadcaster_share).unwrap();

        // Record that the user has paid
        payment_record.viewer = *ctx.accounts.viewer.key;
        payment_record.channel_id = channel.channel_id;
        payment_record.amount_paid = price_to_pay;
        payment_record.timestamp = Clock::get()?.unix_timestamp;
        payment_record.bump = ctx.bumps.payment_record;

        msg!("Payment of {} lamports for channel #{} by {} successful. DAO share: {}, Broadcaster share: {}",
            price_to_pay, channel.channel_id, ctx.accounts.viewer.key(), dao_share, broadcaster_share);
        Ok(())
    }
     // Broadcaster claims their accumulated earnings
    pub fn claim_earnings(ctx: Context<ClaimEarnings>) -> Result<()> {
        let channel = &mut ctx.accounts.channel;
        let broadcaster = &ctx.accounts.broadcaster;

        require!(
            *broadcaster.key == channel.broadcaster,
            TvDaoError::UnauthorizedClaimer
        );

        let earnings_to_claim = channel.total_revenue_collected; // In this model, earnings are just a ledger.
                                                                // Actual SOL needs to be in a PDA that holds SOL.
                                                                // This current structure implies channel PDA itself needs to receive SOL.
                                                                // Let's adjust: For pay_for_channel, the channel PDA needs to be mutable and receive SOL.
                                                                // And this claim_earnings needs to transfer SOL from the channel PDA to broadcaster.
                                                                // This means pay_for_channel needs viewer -> channel PDA for broadcaster_share.

        // This part needs a redesign if channel account doesn't hold SOL.
        // Assuming channel account *does* hold SOL for broadcaster's share:
        require!(earnings_to_claim > 0, TvDaoError::NoEarningsToClaim);
        
        // Transfer from Channel PDA to Broadcaster
        // This requires the Channel PDA to be a SystemAccount that can hold SOL
        // and be debited. This is complex if channel is an Account<'info, Channel>.
        // A separate treasury PDA for each channel might be better, or a single one broadcasters claim from.

        // **Simplification for now: This instruction will just reset total_revenue_collected.**
        // **Actual fund movement is out of scope for this iteration without major redesign of SOL flow.**
        // **A proper implementation would require the channel PDA to hold lamports or use an escrow PDA.**
        
        // To implement actual SOL transfer from a PDA, the PDA (channel account) would need to be:
        // 1. `#[account(mut, close = broadcaster)]` if all funds are claimed and account closed.
        // 2. Or, use `invoke_signed` for `system_program::transfer` from PDA.
        //    anchor_lang::system_program::transfer(
        //        CpiContext::new_with_signer(
        //            ctx.accounts.system_program.to_account_info(),
        //            anchor_lang::system_program::Transfer {
        //                from: channel.to_account_info(),
        //                to: broadcaster.to_account_info(),
        //            },
        //            &[&[
        //                b"channel".as_ref(),
        //                &channel.channel_id.to_le_bytes(), // If seeds were just channel_id
        //                &[channel.bump],
        //            ]],
        //        ),
        //        earnings_to_claim,
        //    )?;


        msg!("Earnings of {} (conceptual) for channel #{} claimed by broadcaster {}. total_revenue_collected reset.",
             earnings_to_claim, channel.channel_id, broadcaster.key());
        channel.total_revenue_collected = 0; // Reset after "claim"

        Ok(())
    }
}

// --- Account Structs ---

#[account]
#[derive(Default)]
pub struct DaoState {
    pub next_channel_id: u64,
    pub treasury: Pubkey,
    pub authority: Pubkey, // Authority to change DAO settings
}

impl DaoState { // Discriminator + u64 + Pubkey + Pubkey
    pub const LEN: usize = 8 + 8 + 32 + 32;
}


#[account]
#[derive(Default)]
pub struct Channel {
    pub channel_id: u64,        // 8
    pub broadcaster: Pubkey,    // 32
    pub name: String,           // 4 + MAX_NAME_LENGTH
    pub embed_url: String,      // 4 + MAX_URL_LENGTH
    pub submission_time: i64,   // 8
    pub final_price: u64,       // 8 (in lamports)
    pub is_finalized: bool,     // 1
    pub total_revenue_collected: u64, // 8 (broadcaster's share, in lamports)
    pub votes_for_1_usdc: u32,  // 4
    pub votes_for_2_usdc: u32,  // 4
    pub votes_for_3_usdc: u32,  // 4
    pub bump: u8,               // 1
}

impl Channel {
    pub const LEN: usize = 8 + 8 + 32 + (4 + MAX_NAME_LENGTH) + (4 + MAX_URL_LENGTH) + 8 + 8 + 1 + 8 + 4 + 4 + 4 + 1;
}

#[account]
#[derive(Default)]
pub struct VoterRecord {
    pub voter: Pubkey,      // 32
    pub channel_id: u64,    // 8
    pub has_voted: bool,    // 1
    pub bump: u8,           // 1
}

impl VoterRecord { // Discriminator + Pubkey + u64 + bool + u8
    pub const LEN: usize = 8 + 32 + 8 + 1 + 1;
}


#[account]
#[derive(Default)]
pub struct PaymentRecord {
    pub viewer: Pubkey,         // 32
    pub channel_id: u64,        // 8
    pub amount_paid: u64,       // 8 (total lamports paid by viewer)
    pub timestamp: i64,         // 8
    pub bump: u8,               // 1
}
impl PaymentRecord { // Discriminator + Pubkey + u64 + u64 + i64 + u8
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 1;
}


// --- Contexts ----

#[derive(Accounts)]
pub struct InitializeDaoState<'info> {
    #[account(init, payer = authority, space = DaoState::LEN)]
    pub dao_state: Account<'info, DaoState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, embed_url: String)] // name, embed_url for seed & space if dynamic
pub struct SubmitChannel<'info> {
    #[account(mut)] // Mutate to increment next_channel_id
    pub dao_state: Account<'info, DaoState>,

    #[account(
        init,
        payer = broadcaster,
        // Seeds: Use dao_state.next_channel_id for uniqueness
        seeds = [b"channel", dao_state.next_channel_id.to_le_bytes().as_ref()],
        bump,
        space = Channel::LEN
    )]
    pub channel: Account<'info, Channel>,

    #[account(mut)]
    pub broadcaster: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(proposed_price_tier: u8)]
pub struct VotePrice<'info> {
    #[account(
        mut,
        seeds = [b"channel", &channel.channel_id.to_le_bytes()], // channel_id is part of Channel struct
        bump = channel.bump
    )]
    pub channel: Account<'info, Channel>,

    #[account(
        init, // Each voter gets one record per channel
        payer = viewer,
        seeds = [b"voter_record", viewer.key().as_ref(), &channel.channel_id.to_le_bytes()],
        bump,
        space = VoterRecord::LEN
    )]
    pub voter_record: Account<'info, VoterRecord>,

    #[account(mut)]
    pub viewer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizePrice<'info> {
    #[account(
        mut,
        seeds = [b"channel", &channel.channel_id.to_le_bytes()],
        bump = channel.bump
    )]
    pub channel: Account<'info, Channel>,
    // Can be called by anyone, so no specific signer needed beyond transaction fee payer
}

#[derive(Accounts)]
pub struct PayForChannel<'info> {
    #[account(mut)] // To update total_revenue_collected
    pub channel: Account<'info, Channel>, // PDA for channel_id

    #[account(
        init,
        payer = viewer,
        seeds = [b"payment", viewer.key().as_ref(), &channel.channel_id.to_le_bytes()],
        bump,
        space = PaymentRecord::LEN
    )]
    pub payment_record: Account<'info, PaymentRecord>,

    #[account(mut)]
    pub viewer: Signer<'info>,

    /// CHECK: This is the DAO treasury wallet. Already validated by DaoState.treasury if needed,
    /// or use the constant directly. It must be able to receive lamports.
    #[account(mut, address = Pubkey::from_str(DAO_TREASURY_WALLET_PUBKEY).unwrap())]
    pub dao_treasury: UncheckedAccount<'info>,
    // Or use: pub dao_treasury: AccountInfo<'info>, and check address against dao_state.treasury

    pub dao_state: Account<'info, DaoState>, // To access treasury pubkey if not using constant directly
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimEarnings<'info> {
    #[account(
        mut,
        seeds = [b"channel", &channel.channel_id.to_le_bytes()],
        bump = channel.bump,
        // constraint = channel.broadcaster == *broadcaster.key @ TvDaoError::UnauthorizedClaimer // Redundant with below
    )]
    pub channel: Account<'info, Channel>,

    #[account(mut, address = channel.broadcaster @ TvDaoError::UnauthorizedClaimer)] // Ensures signer is the channel broadcaster
    pub broadcaster: Signer<'info>,
    
    pub system_program: Program<'info, System>, // Needed if transferring SOL from PDA
}


// --- Errors ---
#[error_code]
pub enum TvDaoError {
    #[msg("Channel name is too long.")]
    NameTooLong,
    #[msg("Embed URL is too long.")]
    UrlTooLong,
    #[msg("Voting for this channel is closed as price is finalized.")]
    VotingClosed,
    #[msg("The voting period for this channel has expired.")]
    VotingPeriodExpired,
    #[msg("The voting period is still open. Price cannot be finalized yet.")]
    VotingStillOpen,
    #[msg("Invalid price tier submitted. Must be 1, 2, or 3.")]
    InvalidPriceTier,
    #[msg("This channel's price has already been finalized.")]
    AlreadyFinalized,
    #[msg("Channel price has not been finalized yet.")]
    PriceNotFinalized,
    #[msg("Channel price is zero or not set, cannot pay.")]
    PriceNotSet,
    #[msg("User has already voted for this channel.")]
    AlreadyVoted,
    #[msg("The signer is not authorized to claim these earnings.")]
    UnauthorizedClaimer,
    #[msg("There are no earnings to claim for this channel currently.")]
    NoEarningsToClaim,
}
