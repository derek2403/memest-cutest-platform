import React, { useEffect, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Shortcut.module.css';

export default function Test() {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      const videoElement = videoRef.current;
      videoElement.play().catch(e => {
        console.warn('Video autoplay failed:', e);
      });
    }
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Video Test Page</title>
        <meta name="description" content="Testing high quality video display" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Video Test</h1>
        
        <div className={styles.videoContainer}>
          <video 
            ref={videoRef}
            className={styles.video}
            src="/assets/allstars.mp4"
            loop
            muted
            playsInline
            autoPlay
            preload="auto"
            controls
          />
        </div>
        
        <p className={styles.description}>
          This page displays the video at its original quality.
        </p>
      </main>
    </div>
  );
}
