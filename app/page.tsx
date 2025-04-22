"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addToGoogleSheet, uploadFilesToDrive } from "@/app/actions"
import { toast } from "@/components/ui/use-toast"

export default function CampaignGenerator() {
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([]) // Empty target audience as requested
  const [tagInput, setTagInput] = useState("")

  // Toggle states for collapsible sections
  const [showOptimizationPreferences, setShowOptimizationPreferences] = useState(false)
  const [showLeadGeneration, setShowLeadGeneration] = useState(false)

  // Form state
  const [businessName, setBusinessName] = useState("")
  const [businessDescription, setBusinessDescription] = useState("")
  const [campaignTitle, setCampaignTitle] = useState("")
  const [campaignGoals, setCampaignGoals] = useState("")
  const [intendedImpact, setIntendedImpact] = useState("")
  const [fileDescription, setFileDescription] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [tone, setTone] = useState("inspiring")
  const [seoOptimization, setSeoOptimization] = useState(false)
  const [leadCapture, setLeadCapture] = useState(false)
  const [outreachMethod, setOutreachMethod] = useState("email")
  const [postType, setPostType] = useState("single")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [manualNavigationNeeded, setManualNavigationNeeded] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file))

      setUploadedFiles([...uploadedFiles, ...newFiles])
      setFilePreviews([...filePreviews, ...newPreviews])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file))

      setUploadedFiles([...uploadedFiles, ...newFiles])
      setFilePreviews([...filePreviews, ...newPreviews])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput) {
      e.preventDefault()
      if (!tags.includes(tagInput)) {
        setTags([...tags, tagInput])
      }
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles]
    const newPreviews = [...filePreviews]

    newFiles.splice(index, 1)
    newPreviews.splice(index, 1)

    setUploadedFiles(newFiles)
    setFilePreviews(newPreviews)
  }

  const handlePlatformToggle = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform))
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform])
    }
  }

  const handleGenerateCampaign = async () => {
    // Form validation for required fields
    if (!businessName || !businessDescription || !campaignTitle || !campaignGoals || !hashtags) {
      setSubmitError("Please fill in all required fields marked with *")
      return
    }

    // Validate that at least one platform is selected
    if (selectedPlatforms.length === 0) {
      setSubmitError("Please select at least one platform")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setManualNavigationNeeded(false)

    try {
      console.log("Starting form submission process")

      // If there are uploaded files, simulate uploading them to Google Drive
      let fileUrl = "https://drive.google.com/drive/folders/14ddNWIXHNwukqbsF-AiJ2ri0T6kzhVRb"

      if (uploadedFiles.length > 0) {
        console.log(`Uploading ${uploadedFiles.length} files...`)
        // In a real app, this would actually upload the files to Google Drive
        const uploadResult = await uploadFilesToDrive(uploadedFiles).catch((error) => {
          console.error("Error in uploadFilesToDrive:", error)
          throw new Error(`File upload error: ${error.message || "Unknown error"}`)
        })

        if (!uploadResult) {
          throw new Error("No response received from file upload")
        }

        if (uploadResult.success) {
          fileUrl = uploadResult.driveUrl
          console.log("Files uploaded successfully:", fileUrl)
        } else {
          throw new Error(uploadResult.message || "Failed to upload files to Google Drive")
        }
      }

      // Prepare the data for Google Sheets
      // Only include SEO and Lead Gen data if those sections were used
      const sheetData: any = {
        businessName,
        businessDescription,
        campaignTitle,
        campaignGoals,
        targetAudience: tags.join(", "),
        intendedImpact,
        uploadedFileName: uploadedFiles.length > 0 ? uploadedFiles.map((file) => file.name).join(", ") : "",
        uploadedFileType: uploadedFiles.length > 0 ? uploadedFiles.map((file) => file.type).join(", ") : "",
        fileUrl,
        fileDescription,
        associatedHashtags: hashtags,
        selectedPlatforms: selectedPlatforms.join(", "),
        tonePreference: tone,
        postType,
      }

      // Only add SEO optimization if that section was used
      if (showOptimizationPreferences) {
        sheetData.seoOptimization = seoOptimization ? "Yes" : "No"
      }

      // Only add lead generation data if that section was used
      if (showLeadGeneration) {
        sheetData.leadGenEnabled = leadCapture ? "Yes" : "No"
        if (leadCapture) {
          sheetData.preferredOutreachMethod = outreachMethod
        }
      }

      // Sanitize data before submission
      Object.keys(sheetData).forEach((key) => {
        if (typeof sheetData[key] === "string") {
          // Basic sanitization
          sheetData[key] = sheetData[key].trim()
        }
      })

      console.log("Submitting data to Google Sheets:", sheetData)

      // Call the server action to add data to Google Sheet
      const result = await addToGoogleSheet(sheetData).catch((error) => {
        console.error("Error in addToGoogleSheet:", error)
        throw new Error(`Google Sheets error: ${error.message || "Unknown error"}`)
      })

      if (!result) {
        throw new Error("No response received from server")
      }

      console.log("Google Sheets response:", result)

      if (result.success) {
        setSubmitSuccess(true)
        toast({
          title: "Success",
          description: "Campaign data successfully added to Google Sheet!",
        })

        try {
          // Navigate to the results page after a short delay
          console.log("Preparing to navigate to results page...")
          setTimeout(() => {
            // Pass some key data as URL parameters
            const url = `/campaign-results?businessName=${encodeURIComponent(businessName)}&campaignTitle=${encodeURIComponent(campaignTitle)}&platforms=${encodeURIComponent(selectedPlatforms.join(", "))}`
            console.log("Navigating to:", url)
            router.push(url)
          }, 1000)
        } catch (navError) {
          console.error("Navigation error:", navError)
          // Provide a manual link as fallback
          setManualNavigationNeeded(true)
          setSubmitError(
            "Form submitted successfully, but navigation failed. Please use the link below to view results.",
          )
        }
      } else {
        throw new Error(result.message || "Failed to add data to Google Sheet")
      }
    } catch (error) {
      console.error("Error submitting campaign:", error)
      setSubmitSuccess(false)
      setSubmitError(error instanceof Error ? error.message : "Failed to submit campaign. Please try again.")

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit campaign. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f7ff]">
      <div className="max-w-4xl mx-auto pb-10">
        {/* Header */}
        <header className="py-5 px-4 bg-gradient-to-r from-[#e6f0ff] to-[#f0f7ff]">
          <div className="flex items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#262626]"
            >
              <path
                d="M4.5 16.5C3 17.5 2 19.5 2 21.5C2 21.5 4.5 21.5 7 20C9.5 18.5 10 16.5 10 16.5M4.5 9.5V5.5C4.5 4.96957 4.71071 4.46086 5.08579 4.08579C5.46086 3.71071 5.96957 3.5 6.5 3.5H17.5C18.0304 3.5 18.5391 3.71071 18.9142 4.08579C19.2893 4.46086 19.5 4.96957 19.5 5.5V9.5M12 12L19.5 9.5V16.7C19.5 17.0448 19.3725 17.3754 19.1438 17.6235C18.915 17.8717 18.5978 18.0222 18.256 18.038L12 18.5L5.744 18.962C5.40218 18.9778 5.08496 18.8272 4.85622 18.5791C4.62748 18.331 4.5 18.0004 4.5 17.6556V9.5L12 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h1 className="text-[#262626] font-medium">Campaign Generator</h1>
          </div>
        </header>

        <div className="space-y-6 px-4">
          {/* Campaign Information */}
          <div className="border border-[#e5e5e5] rounded-md bg-white p-6">
            <h2 className="text-[#262626] font-medium mb-4">Campaign Information</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="business-name" className="block text-sm text-[#525252] mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="business-name"
                  placeholder="Enter business name"
                  className="border-[#e5e5e5] focus:border-[#adaebc] focus:ring-0"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="business-description" className="block text-sm text-[#525252] mb-1">
                  Business Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="business-description"
                  placeholder="Describe your business or organization"
                  className="border-[#e5e5e5] focus:border-[#adaebc] focus:ring-0"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="campaign-title" className="block text-sm text-[#525252] mb-1">
                  Campaign Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="campaign-title"
                  placeholder="Enter campaign title"
                  className="border-[#e5e5e5] focus:border-[#adaebc] focus:ring-0"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="campaign-goals" className="block text-sm text-[#525252] mb-1">
                  Campaign Goals <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="campaign-goals"
                  placeholder="Describe your campaign goals"
                  className="border-[#e5e5e5] focus:border-[#adaebc] focus:ring-0 min-h-[100px]"
                  value={campaignGoals}
                  onChange={(e) => setCampaignGoals(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="target-audience" className="block text-sm text-[#525252] mb-1">
                  Target Audience
                </label>
                <div className="flex flex-wrap gap-2 p-2 border border-[#e5e5e5] rounded-md">
                  {tags.map((tag, index) => (
                    <div
                      key={index}
                      className="bg-[#f5f5f5] text-[#525252] text-xs px-2 py-1 rounded-md flex items-center"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1 text-[#a3a3a3] hover:text-[#525252]">
                        &times;
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add audience tag..."
                    className="flex-1 min-w-[120px] border-none text-sm focus:outline-none text-[#525252] placeholder:text-[#a3a3a3]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="intended-impact" className="block text-sm text-[#525252] mb-1">
                  Intended Impact
                </label>
                <Textarea
                  id="intended-impact"
                  placeholder="Describe the intended impact"
                  className="border-[#e5e5e5] focus:border-[#adaebc] focus:ring-0 min-h-[100px]"
                  value={intendedImpact}
                  onChange={(e) => setIntendedImpact(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="hashtags" className="block text-sm text-[#525252] mb-1">
                  Associated Hashtags <span className="text-red-500">*</span>
                </label>
                <Input
                  id="hashtags"
                  placeholder="Enter hashtags (e.g. #marketing #campaign)"
                  className="border-[#e5e5e5] focus:border-[#adaebc] focus:ring-0"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="border border-[#e5e5e5] rounded-md bg-white p-6">
            <h2 className="text-[#262626] font-medium mb-4">Platform Selection</h2>

            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                className={`border-[#e5e5e5] hover:bg-[#f5f5f5] hover:text-[#262626] ${
                  selectedPlatforms.includes("instagram") ? "bg-[#f5f5f5] border-[#adaebc]" : ""
                }`}
                onClick={() => handlePlatformToggle("instagram")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
                  <path
                    d="M17.5 1.5H6.5C3.73858 1.5 1.5 3.73858 1.5 6.5V17.5C1.5 20.2614 3.73858 22.5 6.5 22.5H17.5C20.2614 22.5 22.5 20.2614 22.5 17.5V6.5C22.5 3.73858 20.2614 1.5 17.5 1.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.5 11.5C16.8978 11.5 17.2794 11.342 17.5607 11.0607C17.842 10.7794 18 10.3978 18 10C18 9.60218 17.842 9.22064 17.5607 8.93934C17.2794 8.65804 16.8978 8.5 16.5 8.5C16.1022 8.5 15.7206 8.65804 15.4393 8.93934C15.158 9.22064 15 9.60218 15 10C15 10.3978 15.158 10.7794 15.4393 11.0607C15.7206 11.342 16.1022 11.5 16.5 11.5Z"
                    fill="currentColor"
                  />
                  <path
                    d="M7.5 22.5V16.5C7.5 14.8431 8.84315 13.5 10.5 13.5H13.5C15.1569 13.5 16.5 14.8431 16.5 16.5V22.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Instagram
              </Button>
              <Button
                variant="outline"
                className={`border-[#e5e5e5] hover:bg-[#f5f5f5] hover:text-[#262626] ${
                  selectedPlatforms.includes("linkedin") ? "bg-[#f5f5f5] border-[#adaebc]" : ""
                }`}
                onClick={() => handlePlatformToggle("linkedin")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
                  <path
                    d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21M2 9H6.5C7.88071 9 9 7.88071 9 6.5V2M16 8V2H8.5C7.83696 2 7.20107 2.26339 6.73223 2.73223C6.26339 3.20107 6 3.83696 6 4.5V6.5C6 7.16304 5.73661 7.79893 5.26777 8.26777C4.79893 8.73661 4.16304 9 3.5 9H2V22H16V14C16 13.3704 16.2328 12.7644 16.6478 12.3478C17.0629 11.9312 17.6678 11.697 18.2961 11.6955C18.9244 11.694 19.5307 11.9254 19.9478 12.3398C20.3648 12.7542 20.6003 13.3591 20.6 13.989V14V21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                LinkedIn
              </Button>
            </div>

            <div>
              <label htmlFor="post-type" className="block text-sm text-[#525252] mb-1">
                Post Type
              </label>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger className="border-[#e5e5e5] focus:ring-0">
                  <SelectValue placeholder="Select post type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optimization Preferences - Collapsible */}
          <div className="border border-[#e5e5e5] rounded-md bg-white overflow-hidden">
            <button
              className="w-full p-6 flex justify-between items-center text-left"
              onClick={() => setShowOptimizationPreferences(!showOptimizationPreferences)}
            >
              <h2 className="text-[#262626] font-medium">Optimization Preferences</h2>
              {showOptimizationPreferences ? (
                <ChevronUp className="h-5 w-5 text-[#525252]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#525252]" />
              )}
            </button>

            {showOptimizationPreferences && (
              <div className="p-6 pt-0 space-y-4 border-t border-[#e5e5e5]">
                <div>
                  <label htmlFor="tone" className="block text-sm text-[#525252] mb-1">
                    Tone
                  </label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="border-[#e5e5e5] focus:ring-0">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inspiring">Inspiring</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seo-optimization"
                    checked={seoOptimization}
                    onCheckedChange={(checked) => setSeoOptimization(checked as boolean)}
                  />
                  <label
                    htmlFor="seo-optimization"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Enable SEO Optimization
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Lead Generation Preferences - Collapsible */}
          <div className="border border-[#e5e5e5] rounded-md bg-white overflow-hidden">
            <button
              className="w-full p-6 flex justify-between items-center text-left"
              onClick={() => setShowLeadGeneration(!showLeadGeneration)}
            >
              <h2 className="text-[#262626] font-medium">Lead Generation Preferences</h2>
              {showLeadGeneration ? (
                <ChevronUp className="h-5 w-5 text-[#525252]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#525252]" />
              )}
            </button>

            {showLeadGeneration && (
              <div className="p-6 pt-0 space-y-4 border-t border-[#e5e5e5]">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lead-capture"
                    checked={leadCapture}
                    onCheckedChange={(checked) => setLeadCapture(checked as boolean)}
                  />
                  <label
                    htmlFor="lead-capture"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Enable lead capture
                  </label>
                </div>

                <div>
                  <label htmlFor="outreach-method" className="block text-sm text-[#525252] mb-1">
                    Outreach Method
                  </label>
                  <Select value={outreachMethod} onValueChange={setOutreachMethod}>
                    <SelectTrigger className="border-[#e5e5e5] focus:ring-0">
                      <SelectValue placeholder="Select outreach method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="call">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* File Upload Area - Moved to bottom */}
          <div
            className="border border-[#e5e5e5] rounded-md bg-white p-8 flex flex-col items-center justify-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="w-full flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 bg-[#f5f5f5] rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 12.5V19.5M19 13.5L19 19.5M5 13.5V19.5M5 8.5C5 6.29086 6.79086 4.5 9 4.5C9.71495 4.5 10.3862 4.67906 10.9697 4.99647C11.9417 3.56295 13.6118 2.5 15.5 2.5C18.5376 2.5 21 4.96243 21 8C21 8.57349 20.9234 9.12972 20.7795 9.65465C22.1416 10.4147 23 11.8702 23 13.5C23 16.2614 20.7614 18.5 18 18.5H17M12 12.5L9 9.5M12 12.5L15 9.5"
                    stroke="#737373"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-[#262626] text-sm">Drag & Drop Files Here</p>
              <p className="text-[#a3a3a3] text-xs">or</p>
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="bg-[#262626] text-white text-sm px-4 py-2 rounded-md flex items-center gap-2">
                  <Upload size={16} />
                  <span>Upload Files</span>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*"
                  multiple // Allow multiple file selection
                />
              </label>
            </div>
          </div>

          {/* File Previews - Updated for multiple files */}
          {filePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <div className="w-full aspect-square bg-[#e5e7eb] rounded-md relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M2.25 15.75L7.40901 11.6578C8.33203 10.9393 9.64435 10.9393 10.5674 11.6578L15.75 15.75M14.25 14.25L15.5412 13.1412C16.4551 12.3999 17.7959 12.3999 18.7098 13.1412L21.75 15.75M3.75 19.5H20.25C21.0784 19.5 21.75 18.8284 21.75 18V6C21.75 5.17157 21.0784 4.5 20.25 4.5H3.75C2.92157 4.5 2.25 5.17157 2.25 6V18C2.25 18.8284 2.92157 19.5 3.75 19.5ZM14.25 8.25H14.2575V8.2575H14.25V8.25ZM14.625 8.25C14.625 8.45711 14.4571 8.625 14.25 8.625C14.0429 8.625 13.875 8.45711 13.875 8.25C13.875 8.04289 14.0429 7.875 14.25 7.875C14.4571 7.875 14.625 8.04289 14.625 8.25Z"
                          stroke="#737373"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <img
                      src={preview || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs text-[#525252] mt-1 flex justify-between items-center">
                    <span className="truncate max-w-[80%]">{uploadedFiles[index]?.name || `Image ${index + 1}`}</span>
                    <button className="p-1 hover:bg-[#f5f5f5] rounded-full" onClick={() => removeFile(index)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Generate Campaign Button */}
          <div className="flex justify-center mt-6">
            <Button
              className="bg-[#262626] hover:bg-[#000000] text-white px-6"
              onClick={handleGenerateCampaign}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                </div>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                  >
                    <path
                      d="M20.25 6.375C20.25 8.65317 16.5563 10.5 12 10.5C7.44365 10.5 3.75 8.65317 3.75 6.375M20.25 6.375C20.25 4.09683 16.5563 2.25 12 2.25C7.44365 2.25 3.75 4.09683 3.75 6.375M20.25 6.375V17.625C20.25 19.9032 16.5563 21.75 12 21.75C7.44365 21.75 3.75 19.9032 3.75 17.625V6.375M20.25 12C20.25 14.2782 16.5563 16.125 12 16.125C7.44365 16.125 3.75 14.2782 3.75 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Generate Campaign
                </>
              )}
            </Button>
          </div>

          {submitSuccess && (
            <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md text-center">
              Campaign data successfully added to Google Sheet!
              {manualNavigationNeeded && (
                <div className="mt-2">
                  <a
                    href={`/campaign-results?businessName=${encodeURIComponent(businessName)}&campaignTitle=${encodeURIComponent(campaignTitle)}&platforms=${encodeURIComponent(selectedPlatforms.join(", "))}`}
                    className="underline text-blue-600 hover:text-blue-800"
                  >
                    Click here to view campaign results
                  </a>
                </div>
              )}
            </div>
          )}
          {submitError && <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md text-center">{submitError}</div>}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-[#a3a3a3] mt-10">
          © 2025 Campaign Generator. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
