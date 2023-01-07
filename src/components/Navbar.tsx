import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import HolonymLogo from "../img/Holonym-Logo-B.png";
import styles from "../styles/Home.module.css";
// import LoginButton from "./ConnectWalletButton";

export default function Navbar() {
  return (
    <>
      <div id="navbar" className="navbar">
        <div>
          <a
            href="https://holonym.id"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "Clover Regular" }}
          >
            <Image src={HolonymLogo} alt="Holonym Logo" width={120} priority />
          </a>
          <h1 className="header-text">Example Issuer</h1>
        </div>
        {/* <LoginButton /> */}
      </div>
    </>
  );
}
