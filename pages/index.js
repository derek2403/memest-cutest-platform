import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Landland() {
  const router = useRouter();
  
  const handleClick = () => {
    router.push('/map');
  };
  
  return (
    <>
      <Head>
        <title>Land Land</title>
        <meta name="description" content="Land Land page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container" onClick={handleClick}>
        <main className="main">
        </main>

        <style jsx global>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            overflow: hidden;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .container {
            width: 100%;
            height: 100vh;
            margin: 0;
            padding: 0;
            cursor: pointer;
          }
          
          .container::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('/assets/land.png');
            background-size: 100% 100%;
            background-position: 0 0;
            background-repeat: no-repeat;
            z-index: -1;
          }
          
          .title {
            color: #333;
            margin-bottom: 20px;
          }
          
          .description {
            color: #333;
          }
        `}</style>
      </div>
    </>
  );
}
