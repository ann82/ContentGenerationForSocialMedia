"use server"

import { google } from "googleapis"

// Define the shape of the data we're sending to Google Sheets
interface SheetData {
  businessName: string
  businessDescription: string
  campaignTitle: string
  campaignGoals: string
  targetAudience: string
  intendedImpact: string
  uploadedFileName: string
  uploadedFileType: string
  fileUrl: string
  fileDescription: string
  associatedHashtags: string
  selectedPlatforms: string
  tonePreference: string
  seoOptimization?: string // Optional
  leadGenEnabled?: string // Optional
  preferredOutreachMethod?: string // Optional
  postType: string
}

// Define the shape of the content generation data
interface ContentGenerationData {
  rowNum: number
  mediaUrl: string
  platform: string
  platformPostType: string
  caption: string
  generatedContent: string
  createdDateTime: string
  approved: string
}

export async function addToGoogleSheet(data: SheetData) {
  console.log("Starting addToGoogleSheet with data:", JSON.stringify(data, null, 2))

  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
      throw new Error("GOOGLE_SHEETS_CLIENT_EMAIL environment variable is not set")
    }

    if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      throw new Error("GOOGLE_SHEETS_PRIVATE_KEY environment variable is not set")
    }

    if (!process.env.GOOGLE_SHEET_ID) {
      throw new Error("GOOGLE_SHEET_ID environment variable is not set")
    }

    console.log("Environment variables verified")

    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    console.log("Auth created successfully")

    const sheets = google.sheets({ version: "v4", auth })

    // The ID of your spreadsheet
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    // The range where data should be written (sheet name and range)
    const range = "UI Data!A:Q" // Using the UI Data sheet as specified

    console.log("Preparing to write to sheet:", range)

    // Format the data as a row for Google Sheets
    // Sanitize data before submission
    const sanitizedData = { ...data }
    Object.keys(sanitizedData).forEach((key) => {
      if (typeof sanitizedData[key] === "string") {
        // Basic sanitization
        sanitizedData[key] = sanitizedData[key].trim()
      }
    })

    const values = [
      [
        sanitizedData.businessName,
        sanitizedData.businessDescription,
        sanitizedData.campaignTitle,
        sanitizedData.campaignGoals,
        sanitizedData.targetAudience,
        sanitizedData.intendedImpact,
        sanitizedData.uploadedFileName,
        sanitizedData.uploadedFileType,
        sanitizedData.fileUrl,
        sanitizedData.fileDescription,
        sanitizedData.associatedHashtags,
        sanitizedData.selectedPlatforms,
        sanitizedData.tonePreference,
        sanitizedData.seoOptimization || "", // Use empty string if not provided
        sanitizedData.leadGenEnabled || "", // Use empty string if not provided
        sanitizedData.preferredOutreachMethod || "", // Use empty string if not provided
        sanitizedData.postType,
      ],
    ]

    // Implement retry logic with exponential backoff
    const maxRetries = 3
    let retryCount = 0
    let lastError = null

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} of ${maxRetries}: Appending data to sheet...`)

        // Append the data to the sheet
        const response = await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values,
          },
        })

        console.log("Data appended successfully:", JSON.stringify(response.data, null, 2))

        return {
          success: true,
          message: "Data added successfully",
          rowNumber: response.data.updates?.updatedRows,
        }
      } catch (error) {
        lastError = error
        console.error(`Attempt ${retryCount + 1} failed:`, error)

        if (error.response) {
          console.error("Response data:", error.response.data)
          console.error("Response status:", error.response.status)
        }

        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        console.log(`Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        retryCount++
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error("All retry attempts failed")
  } catch (error) {
    console.error("Error adding data to Google Sheet:", error)
    // Return a more detailed error message
    return {
      success: false,
      message: error instanceof Error ? `Error: ${error.message}` : "Failed to add data to Google Sheet: Unknown error",
      details: error instanceof Error ? error.stack : undefined,
    }
  }
}

// In a real application, this would be a function to upload files to Google Drive
// For this demo, we'll simulate the upload
export async function uploadFilesToDrive(files: File[]) {
  console.log(`Starting uploadFilesToDrive with ${files.length} files`)

  try {
    // In a real implementation, this would use the Google Drive API to upload files
    console.log(`Uploading ${files.length} files to Google Drive...`)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Return success with the Google Drive folder URL
    return {
      success: true,
      message: "Files uploaded successfully",
      driveUrl: "https://drive.google.com/drive/folders/14ddNWIXHNwukqbsF-AiJ2ri0T6kzhVRb",
    }
  } catch (error) {
    console.error("Error uploading files to Google Drive:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload files to Google Drive",
      details: error instanceof Error ? error.stack : undefined,
    }
  }
}

// New function to fetch content generation data from Google Sheets
export async function fetchContentGenerationData(
  businessName: string,
  campaignTitle: string,
): Promise<{
  success: boolean
  message: string
  data?: ContentGenerationData[]
}> {
  console.log(`Starting fetchContentGenerationData for business: ${businessName}, campaign: ${campaignTitle}`)

  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
      throw new Error("GOOGLE_SHEETS_CLIENT_EMAIL environment variable is not set")
    }

    if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      throw new Error("GOOGLE_SHEETS_PRIVATE_KEY environment variable is not set")
    }

    if (!process.env.GOOGLE_SHEET_ID) {
      throw new Error("GOOGLE_SHEET_ID environment variable is not set")
    }

    console.log("Environment variables verified")

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    console.log("Auth created successfully")

    const sheets = google.sheets({ version: "v4", auth })
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    console.log("Fetching data from Content Generation sheet")

    // Implement retry logic with exponential backoff
    const maxRetries = 3
    let retryCount = 0
    let lastError = null

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} of ${maxRetries}: Fetching sheet data...`)

        // Fetch data from the Content Generation sheet
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: "Content Generation!A:H", // Columns A through H
        })

        const rows = response.data.values

        if (!rows || rows.length === 0) {
          return {
            success: false,
            message: "No data found in Content Generation sheet",
          }
        }

        console.log(`Fetched ${rows.length} rows from Content Generation sheet`)

        // Extract header row
        const headers = rows[0]
        console.log("Headers:", headers)

        // Find the indices of the columns we need
        const rowNumIndex = headers.findIndex((header: string) => header === "Row Num")
        const mediaUrlIndex = headers.findIndex((header: string) => header === "Media URL")
        const platformIndex = headers.findIndex((header: string) => header === "Platform")
        const platformPostTypeIndex = headers.findIndex((header: string) => header === "Platform Post Type")
        const captionIndex = headers.findIndex((header: string) => header === "Caption")
        const generatedContentIndex = headers.findIndex((header: string) => header === "Generated Content")
        const createdDateTimeIndex = headers.findIndex((header: string) => header === "Created Date and Time")
        const approvedIndex = headers.findIndex((header: string) => header === "Approved")

        // Check if all required columns exist
        if (rowNumIndex === -1 || platformIndex === -1 || generatedContentIndex === -1) {
          throw new Error("Required columns are missing from the Content Generation sheet")
        }

        // Filter rows based on business name and campaign title
        // In a real implementation, you might have columns for these or use other criteria
        // For now, we'll just return all rows (skipping the header)
        const contentData: ContentGenerationData[] = rows.slice(1).map((row: any[]) => ({
          rowNum: Number.parseInt(row[rowNumIndex] || "0", 10),
          mediaUrl: row[mediaUrlIndex] || "",
          platform: row[platformIndex] || "",
          platformPostType: row[platformPostTypeIndex] || "",
          caption: row[captionIndex] || "",
          generatedContent: row[generatedContentIndex] || "",
          createdDateTime: row[createdDateTimeIndex] || "",
          approved: row[approvedIndex] || "",
        }))

        console.log(`Processed ${contentData.length} content items`)

        return {
          success: true,
          message: "Content generation data fetched successfully",
          data: contentData,
        }
      } catch (error) {
        lastError = error
        console.error(`Attempt ${retryCount + 1} failed:`, error)

        if (error.response) {
          console.error("Response data:", error.response.data)
          console.error("Response status:", error.response.status)
        }

        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        console.log(`Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        retryCount++
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error("All retry attempts failed")
  } catch (error) {
    console.error("Error fetching content generation data:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch content generation data",
      details: error instanceof Error ? error.stack : undefined,
    }
  }
}

// Function to trigger the make.com webhook with row number
export async function triggerMakeWebhook(postData: {
  rowNum: number
  platform: string
  content: string
  businessName: string
  campaignTitle: string
  mediaUrl?: string
  caption?: string
}) {
  console.log(`Starting triggerMakeWebhook for row ${postData.rowNum}, platform: ${postData.platform}`)

  try {
    // Replace this URL with your actual make.com webhook URL
    const webhookUrl = "https://hook.us2.make.com/6aoqirjveramucugcor15zmgcbg43d5j"

    console.log(`Triggering make.com webhook for ${postData.platform} post (Row ${postData.rowNum})...`)

    // Implement retry logic with exponential backoff
    const maxRetries = 3
    let retryCount = 0
    let lastError = null

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} of ${maxRetries}: Calling webhook...`)

        // Call the make.com webhook
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log("Webhook response:", result)

        return {
          success: true,
          message: `Post successfully sent to ${postData.platform}`,
          data: result,
        }
      } catch (error) {
        lastError = error
        console.error(`Attempt ${retryCount + 1} failed:`, error)

        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        console.log(`Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        retryCount++
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error("All retry attempts failed")
  } catch (error) {
    console.error("Error triggering make.com webhook:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to trigger make.com webhook",
      details: error instanceof Error ? error.stack : undefined,
    }
  }
}

// Function to publish all posts via make.com webhook
export async function publishAllPosts(
  posts: Array<{
    rowNum: number
    platform: string
    content: string
    businessName: string
    campaignTitle: string
    mediaUrl?: string
    caption?: string
  }>,
) {
  console.log(`Starting publishAllPosts with ${posts.length} posts`)

  try {
    const results = await Promise.all(posts.map((post) => triggerMakeWebhook(post)))

    const allSuccessful = results.every((result) => result.success)
    console.log(`Published ${results.filter((r) => r.success).length}/${posts.length} posts successfully`)

    return {
      success: allSuccessful,
      message: allSuccessful ? "All posts published successfully" : "Some posts failed to publish",
      results,
    }
  } catch (error) {
    console.error("Error publishing all posts:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to publish posts",
      details: error instanceof Error ? error.stack : undefined,
    }
  }
}
