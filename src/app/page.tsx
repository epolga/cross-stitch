"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface Design {
  designId: string;
  nPage: number;
  caption: string;
}

export default function Home() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Fetching designs...");
    fetch("/api/designs?albumId=15&limit=5")
        .then(res => {
          console.log("Fetch response for albumId 15:", res.status, res.statusText);
          return res.json();
        })
        .then((data: Design[] | { error: string }) => {
          console.log("Fetch data:", data);
          if (Array.isArray(data)) {
            setDesigns(data);
          } else {
            setError(data.error || "Failed to fetch designs");
          }
        })
        .catch(err => {
          console.error("Fetch error:", err);
          setError(err.message);
        });
  }, []);

  return (
      <div className={styles.page}>
        <main className={styles.main}>
          <Image
              className={styles.logo}
              src="/next.svg"
              alt="Next.js logo"
              width={180}
              height={38}
              priority
          />
          <h1>Next.js DynamoDB Template</h1>
          {error ? (
              <p>Error: {error}</p>
          ) : designs.length > 0 ? (
              <ul>
                {designs.map(design => (
                    <li key={`${design.designId}-${design.nPage}`}>
                      Design ID: {design.designId}, Page: {design.nPage}, Caption: {design.caption}
                    </li>
                ))}
              </ul>
          ) : (
              <p>No designs found.</p>
          )}
          <div className={styles.ctas}>
            <a
                className={styles.primary}
                href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
            >
              <Image
                  className={styles.logo}
                  src="/vercel.svg"
                  alt="Vercel logomark"
                  width={20}
                  height={20}
              />
              Deploy now
            </a>
            <a
                href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondary}
            >
              Read our docs
            </a>
          </div>
        </main>
        <footer className={styles.footer}>
          <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
          >
            <Image
                aria-hidden
                src="/file.svg"
                alt="File icon"
                width={16}
                height={16}
            />
            Learn
          </a>
          <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
          >
            <Image
                aria-hidden
                src="/window.svg"
                alt="Window icon"
                width={16}
                height={16}
            />
            Examples
          </a>
          <a
              href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
          >
            <Image
                aria-hidden
                src="/globe.svg"
                alt="Globe icon"
                width={16}
                height={16}
            />
            Go to nextjs.org →
          </a>
        </footer>
      </div>
  );
}