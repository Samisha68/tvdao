import Image from "next/image";
import Link from "next/link";

export function Logo({ size = 56, href = "/" }: { size?: number; href?: string }) {
  return (
    <Link href={href} className="group inline-block" aria-label="TV DAO Home">
      <span
        className="inline-block transition-all duration-300 rounded-full group-hover:shadow-[0_0_24px_6px_rgba(127,0,0,0.7),0_0_48px_12px_rgba(255,0,0,0.4)]"
        style={{ boxShadow: "0 0 0 0 transparent" }}
      >
        <Image
          src="/tvdao-logo.png"
          alt="TV DAO Logo"
          width={size}
          height={size}
          priority
          className="block"
        />
      </span>
    </Link>
  );
} 