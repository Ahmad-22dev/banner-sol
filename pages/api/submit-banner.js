// File: pages/api/submit-banner.js
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Connection, PublicKey } from '@solana/web3.js';

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form with files
    const form = new IncomingForm({
      uploadDir: './tmp',
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    // Process the form data
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Verify payment transaction (in production, you would verify this on the Solana network)
    const paymentSignature = fields.paymentSignature?.[0];
    const bannerType = fields.bannerType?.[0];
    const contractAddress = fields.contractAddress?.[0];
    const email = fields.email?.[0];
    
    if (!paymentSignature || !contractAddress || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In a real application, you would verify the transaction on Solana
    // Here's how you might do it:
    /*
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    try {
      const tx = await connection.getTransaction(paymentSignature);
      // Verify amount, recipient, etc.
      const expectedAmount = bannerType === 'basic' ? 0.1 * LAMPORTS_PER_SOL : 0.2 * LAMPORTS_PER_SOL;
      // Verify transaction details...
    } catch (error) {
      return res.status(400).json({ error: 'Invalid transaction' });
    }
    */

    // Generate a unique ID for this order
    const orderId = uuidv4();
    
    // Store the order information (in production, you would use a database)
    const orderData = {
      id: orderId,
      contractAddress,
      bannerText: fields.bannerText?.[0] || '',
      email,
      telegram: fields.telegram?.[0] || '',
      bannerType,
      paymentSignature,
      timestamp: new Date().toISOString(),
      status: 'processing',
    };

    // In a real application, you would:
    // 1. Save the order to a database
    // 2. Store the uploaded files in a secure location
    // 3. Start a background process to generate the banner
    // 4. Send an email confirmation to the user

    // For demo purposes, we'll just pretend we saved everything
    
    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Banner request received successfully',
      orderId
    });

    // In a real application, you would now:
    // 1. Generate the banner (either automatically or queue it for manual creation)
    // 2. Send it to the user via email
    // 3. Update the order status in your database

  } catch (error) {
    console.error('Error processing banner request:', error);
    res.status(500).json({ error: 'Failed to process banner request' });
  }
}
