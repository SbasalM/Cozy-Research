import { NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

// Create a client
const client = new vision.ImageAnnotatorClient({
  keyFilename: 'config/google/vision-credentials.json',
});

// Simple in-memory counter (resets on server restart)
let dailyRequests = 0;
let monthlyRequests = 0;
let lastReset = new Date();

// Constants
const DAILY_LIMIT = 100;
const MONTHLY_LIMIT = 1000; // Free tier limit

function resetCountersIfNeeded() {
  const now = new Date();
  
  // Reset daily counter if it's a new day
  if (now.getDate() !== lastReset.getDate()) {
    dailyRequests = 0;
  }
  
  // Reset monthly counter if it's a new month
  if (now.getMonth() !== lastReset.getMonth()) {
    monthlyRequests = 0;
  }
  
  lastReset = now;
}

export async function POST(request: Request) {
  try {
    resetCountersIfNeeded();

    // Check limits
    if (dailyRequests >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Daily usage limit reached. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    if (monthlyRequests >= MONTHLY_LIMIT) {
      return NextResponse.json(
        { error: 'Monthly free tier limit reached.' },
        { status: 429 }
      );
    }

    const { image } = await request.json();
    
    // Remove the data URL prefix to get just the base64 data
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
    
    // Perform text detection
    const [result] = await client.textDetection({
      image: {
        content: base64Image
      }
    });

    // Increment counters
    dailyRequests++;
    monthlyRequests++;

    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return NextResponse.json({ text: '' });
    }

    // The first annotation contains the entire text
    const extractedText = detections[0].description;

    return NextResponse.json({ 
      text: extractedText,
      usage: {
        daily: dailyRequests,
        monthly: monthlyRequests,
        dailyLimit: DAILY_LIMIT,
        monthlyLimit: MONTHLY_LIMIT
      }
    });
  } catch (error) {
    console.error('Vision API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}