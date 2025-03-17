// File: pages/index.js

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import Head from 'next/head';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Replace with your actual wallet address
const RECIPIENT_WALLET = "6zhLuGqFfVfYsRNUrkXSMxhCpKK63JCJvFccosBBhqf8";

export default function Home() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const [contractAddress, setContractAddress] = useState('');
  const [bannerText, setBannerText] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [selectedOption, setSelectedOption] = useState('basic');
  const [logoFile, setLogoFile] = useState(null);
  const [screenshotFiles, setScreenshotFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handlePayment = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (!contractAddress || !email) {
      toast.error('Please fill in the required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      toast.info('Initiating payment process...');

      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const amount = selectedOption === 'basic' ? 0.1 * LAMPORTS_PER_SOL : 0.2 * LAMPORTS_PER_SOL;
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(RECIPIENT_WALLET),
          lamports: amount,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      toast.success('Payment successful! Submitting your banner request...');
      await submitBannerRequest(signature);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + error.message);
      setIsSubmitting(false);
    }
  };

  const submitBannerRequest = async (paymentSignature) => {
    // Create a FormData object to send files
    const formData = new FormData();
    formData.append('contractAddress', contractAddress);
    formData.append('bannerText', bannerText);
    formData.append('email', email);
    formData.append('telegram', telegram);
    formData.append('bannerType', selectedOption);
    formData.append('paymentSignature', paymentSignature);
    
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    
    if (screenshotFiles.length > 0) {
      screenshotFiles.forEach((file, index) => {
        formData.append(`screenshot_${index}`, file);
      });
    }

    try {
      const response = await fetch('/api/submit-banner', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit banner request');
      }

      const data = await response.json();
      toast.success('Banner request submitted successfully!');

      // For demo purposes, we’ll just show a preview image on the page.
      // In a real scenario, your back end might generate a unique preview
      // or email the user with their final banner.
      setPreviewUrl('/sample-banner-preview.png');
      setIsSubmitting(false);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit banner request: ' + error.message);
      setIsSubmitting(false);
    }
  };

  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleScreenshotsChange = (e) => {
    if (e.target.files.length > 0) {
      setScreenshotFiles(Array.from(e.target.files));
    }
  };

  const handleManualSubmit = () => {
    toast.info(
      'For manual payment, please send ' +
      (selectedOption === 'basic' ? '0.1' : '0.2') +
      ' SOL to: ' + RECIPIENT_WALLET
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white">
      <Head>
        <title>Solana Banner Service</title>
        <meta name="description" content="Get custom banners for your Solana project" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ToastContainer position="top-right" theme="dark" />

      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Banner<span className="text-yellow-400">SOL</span></h1>
          </div>
          <div>
            <WalletMultiButton className="!bg-yellow-500 hover:!bg-yellow-600" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="max-w-3xl mx-auto bg-gray-800 bg-opacity-50 rounded-xl p-6 backdrop-blur-sm shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Create Your Custom Solana Project Banner</h2>
          
          {previewUrl ? (
            <div className="mb-8 text-center">
              <h3 className="text-xl font-bold mb-4">Your Banner Preview</h3>
              <div className="bg-gray-700 p-4 rounded-lg inline-block">
                <img src={previewUrl} alt="Banner Preview" className="max-w-full h-auto rounded" />
              </div>
              <p className="mt-4">Your banner will be sent to {email} once it's ready!</p>
              <button 
                onClick={() => {
                  setPreviewUrl(null);
                  setContractAddress('');
                  setBannerText('');
                  setEmail('');
                  setTelegram('');
                  setLogoFile(null);
                  setScreenshotFiles([]);
                }} 
                className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition"
              >
                Create Another Banner
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-6">
                  {/* Banner Option */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Banner Option</label>
                    <div className="flex gap-4">
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer flex-1 text-center ${
                          selectedOption === 'basic'
                            ? 'border-yellow-400 bg-yellow-900 bg-opacity-30'
                            : 'border-gray-600 hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedOption('basic')}
                      >
                        <h3 className="font-bold">Basic</h3>
                        <p className="text-xl font-bold text-yellow-400">0.1 SOL</p>
                        <p className="text-sm text-gray-300 mt-2">Standard banner with logo and text</p>
                      </div>
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer flex-1 text-center ${
                          selectedOption === 'premium'
                            ? 'border-yellow-400 bg-yellow-900 bg-opacity-30'
                            : 'border-gray-600 hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedOption('premium')}
                      >
                        <h3 className="font-bold">Premium</h3>
                        <p className="text-xl font-bold text-yellow-400">0.2 SOL</p>
                        <p className="text-sm text-gray-300 mt-2">Custom design with screenshots and effects</p>
                      </div>
                    </div>
                  </div>

                  {/* Contract Address */}
                  <div>
                    <label htmlFor="contractAddress" className="block text-sm font-medium mb-1">
                      Contract Address (CA) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="contractAddress"
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                      className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      placeholder="Enter your project's contract address"
                      required
                    />
                  </div>

                  {/* Banner Text */}
                  <div>
                    <label htmlFor="bannerText" className="block text-sm font-medium mb-1">
                      Banner Text
                    </label>
                    <textarea
                      id="bannerText"
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      placeholder="Text to appear on your banner"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      placeholder="Where to send your banner"
                      required
                    />
                  </div>

                  {/* Telegram */}
                  <div>
                    <label htmlFor="telegram" className="block text-sm font-medium mb-1">
                      Telegram Handle (Optional)
                    </label>
                    <input
                      type="text"
                      id="telegram"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      placeholder="Your Telegram username"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Project Logo
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-400">
                          <label
                            htmlFor="logo-upload"
                            className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-yellow-400 hover:text-yellow-300 focus-within:outline-none"
                          >
                            <span>Upload a file</span>
                            <input
                              id="logo-upload"
                              name="logo-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleLogoChange}
                              accept="image/*"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                        {logoFile && (
                          <p className="text-sm text-green-400">{logoFile.name}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Screenshots (Premium only) */}
                  {selectedOption === 'premium' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Screenshots (Premium only)
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-lg">
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-400">
                            <label
                              htmlFor="screenshots-upload"
                              className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-yellow-400 hover:text-yellow-300 focus-within:outline-none"
                            >
                              <span>Upload files</span>
                              <input
                                id="screenshots-upload"
                                name="screenshots-upload"
                                type="file"
                                className="sr-only"
                                onChange={handleScreenshotsChange}
                                multiple
                                accept="image/*"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-400">
                            Up to 3 screenshots (PNG, JPG, GIF)
                          </p>
                          {screenshotFiles.length > 0 && (
                            <p className="text-sm text-green-400">
                              {screenshotFiles.length} file(s) selected
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-600">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div>
                    <p className="text-lg font-bold">
                      Total: <span className="text-yellow-400">
                        {selectedOption === 'basic' ? '0.1' : '0.2'} SOL
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleManualSubmit}
                      className="px-5 py-2 bg-transparent border border-yellow-400 text-yellow-400 rounded-lg hover:bg-yellow-400 hover:text-gray-900 transition"
                    >
                      Manual Payment Instructions
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={isSubmitting || !connected}
                      className={`px-5 py-2 rounded-lg transition flex items-center justify-center ${
                        connected
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                          : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : connected ? (
                        'Pay with Connected Wallet'
                      ) : (
                        'Connect Wallet to Pay'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
        
        <section className="max-w-4xl mx-auto mt-12 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-gray-900 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Simple Payment</h3>
              <p className="text-gray-300">
                Pay with just 0.1 or 0.2 SOL using your connected wallet or send manually to our address.
              </p>
            </div>
            
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-gray-900 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Custom Designs</h3>
              <p className="text-gray-300">
                Get professional banners customized with your project's branding, logos, and screenshots.
              </p>
            </div>
            
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-gray-900 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Fast Delivery</h3>
              <p className="text-gray-300">
                Receive your custom banner quickly via email after your payment is confirmed.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-auto">
        <div className="border-t border-gray-700 pt-6 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} BannerSOL. All rights reserved.</p>
          <p className="mt-2">Powered by Solana Blockchain</p>
        </div>
      </footer>
    </div>
  );
}
