import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

// This is the main handler for the API route.
// It will be called when a request is made to /api/rsvp.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Destructure the message from the request body
    const { name, attending, guests, phonenumber, message } = body;

    // --- Authentication with Google Sheets ---
    // The credentials are store in environment variables for security.
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1qmH94UaJRNijT3QW97AgUT5Kc7m7Q-q5OZRlhFKziLs';
    // The range to read from. We only need column A to find the guest's row.
    const readRange = 'Sheet1!A:A';

    // 1. Find the guest in the sheet
    const getRowsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: readRange,
    });

    const rows = getRowsResponse.data.values;
    if (!rows) {
      return NextResponse.json({ error: 'Could not find any data in the sheet.' }, { status: 500 });
    }

    const rowIndex = rows.findIndex(row => row[0] === name);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Guest not found.' }, { status: 404 });
    }

    // The row index in the API is 0-based, but in Google Sheets it's 1-based.
    // So we add 1 to the index to get the correct sheet row number.
    const sheetRowIndex = rowIndex + 1;

    // The range to update. We now write to columns C through G.
    const updateRange = `Sheet1!C${sheetRowIndex}:G${sheetRowIndex}`;

    // 2. Update the specific cells for that guest
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange, // Use the new, wider update range
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            attending === 'yes' ? 'Yes' : 'No', // Column C: Reserved
            attending === 'yes' ? guests : '',  // Column D: Number of Guests
            phonenumber,                        // Column E: Phone Number
            message || ''                       // Column F: Special Message
          ]
        ],
      },
    });

    return NextResponse.json({ success: true, data: updateResponse.data });
  } catch (error) {
    console.error('API Error:', error);
    // It's good practice to not expose detailed error messages to the client.
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

