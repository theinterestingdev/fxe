# Username Fix Scripts

This directory contains scripts to automatically fix the username issues in the chat system.

## What the Fix Does

These scripts will:

1. Update the Profile schema to include username, email, and avatar fields
2. Create a Profile Service to handle profile data
3. Add a handler for the `getUsersList` socket event
4. Generate usernames for all users based on their email addresses
5. Update all user profiles in the database with the correct usernames
6. Make the chat display the proper usernames

## Running the Fix (Windows)

If you're on Windows, simply run:

```powershell
# Navigate to the scripts directory
cd backend/scripts

# Run the PowerShell script (right-click and "Run with PowerShell" also works)
.\deployFixes.ps1
```

## Running the Fix (Linux/Mac)

If you're on Linux or Mac, run:

```bash
# Navigate to the scripts directory
cd backend/scripts

# Make the script executable
chmod +x deployFixes.sh

# Run the script
./deployFixes.sh
```

## Manual Steps

If the automatic script doesn't work for some reason, you can run the individual components:

1. Add the required fields to the Profile schema
2. Create the Profile Service
3. Run the fixUsernames.js script:

```bash
node backend/scripts/fixUsernames.js
```

4. Restart your server

## Verifying the Fix

After running the scripts and restarting the server:

1. Log in to the application
2. Go to the Dashboard or Community page
3. Open the chat with another user
4. Verify that your username appears correctly
5. Verify that other users' usernames appear correctly

If you still see issues, check the server logs for any errors.

## Configuration

The scripts use the MongoDB connection string from your `.env` file. Make sure this is configured correctly before running the scripts. 