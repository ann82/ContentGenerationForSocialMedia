"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { fetchContentGenerationData, triggerMakeWebhook, publishAllPosts } from "@/app/actions"
import { toast } from "@/components/ui/use-toast"

interface Post {
  rowNum: number
  platform: string
  mediaUrl: string
  content: string
  caption?: string
  platformPostType: string
  createdDateTime: string
  approved: string
  isPublishing?: boolean
  isPublished?: boolean
}

export default function CampaignResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [campaignData, setCampaignData] = useState({
    businessName: "",
    campaignTitle: "",
    platforms: "",
  })

  // State for posts based on selected platforms
  const [posts, setPosts] = useState<Post[]>([])
  const [isPublishingAll, setIsPublishingAll] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadContentData() {
      setIsLoading(true)
      setError(null)

      try {
        // Get data from URL parameters
        const businessName = searchParams.get("businessName") || ""
        const campaignTitle = searchParams.get("campaignTitle") || ""
        const platforms = searchParams.get("platforms") || ""

        setCampaignData({
          businessName,
          campaignTitle,
          platforms,
        })

        // Fetch content generation data from Google Sheets
        const result = await fetchContentGenerationData(businessName, campaignTitle)

        if (result.success && result.data) {
          // Transform the data into the format we need for the UI
          const formattedPosts = result.data.map((item) => ({
            rowNum: item.rowNum,
            platform: item.platform,
            mediaUrl: item.mediaUrl || "/placeholder.svg?height=400&width=400",
            content: item.generatedContent,
            caption: item.caption,
            platformPostType: item.platformPostType,
            createdDateTime: item.createdDateTime,
            approved: item.approved,
            isPublishing: false,
            isPublished: false,
          }))

          setPosts(formattedPosts)
        } else {
          throw new Error(result.message || "Failed to fetch content generation data")
        }
      } catch (err) {
        console.error("Error loading content data:", err)
        setError(err instanceof Error ? err.message : "An error occurred while loading content data")

        // Set empty posts array to show the "No platforms" message
        setPosts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadContentData()
  }, [searchParams])

  const handleRegeneratePost = (rowNum: number) => {
    // In a real app, this would call an API to regenerate the post
    console.log(`Regenerating post with row number ${rowNum}`)

    // For demo purposes, just update the content
    setPosts(
      posts.map((post) =>
        post.rowNum === rowNum
          ? {
              ...post,
              content: `Regenerated content for ${post.platform} post. This is a new version of the original content. #Updated #Fresh`,
              isPublished: false, // Reset published state when regenerated
            }
          : post,
      ),
    )
  }

  const handlePublishPost = async (rowNum: number) => {
    // Find the post
    const post = posts.find((p) => p.rowNum === rowNum)
    if (!post) return

    // Update UI to show publishing state
    setPosts(posts.map((p) => (p.rowNum === rowNum ? { ...p, isPublishing: true } : p)))

    try {
      // Call the server action to trigger the make.com webhook
      const result = await triggerMakeWebhook({
        rowNum: post.rowNum,
        platform: post.platform.toLowerCase(),
        content: post.content,
        businessName: campaignData.businessName,
        campaignTitle: campaignData.campaignTitle,
        mediaUrl: post.mediaUrl,
        caption: post.caption,
      })

      if (result.success) {
        // Update UI to show published state
        setPosts(posts.map((p) => (p.rowNum === rowNum ? { ...p, isPublishing: false, isPublished: true } : p)))

        // Show success toast
        toast({
          title: "Post Published",
          description: `Your ${post.platform} post has been published successfully.`,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error publishing post:", error)

      // Update UI to show error state
      setPosts(posts.map((p) => (p.rowNum === rowNum ? { ...p, isPublishing: false } : p)))

      // Show error toast
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "Failed to publish post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePublishAll = async () => {
    setIsPublishingAll(true)

    try {
      // Prepare post data for the server action
      const postsData = posts.map((post) => ({
        rowNum: post.rowNum,
        platform: post.platform.toLowerCase(),
        content: post.content,
        businessName: campaignData.businessName,
        campaignTitle: campaignData.campaignTitle,
        mediaUrl: post.mediaUrl,
        caption: post.caption,
      }))

      // Call the server action to publish all posts
      const result = await publishAllPosts(postsData)

      if (result.success) {
        // Update all posts to published state
        setPosts(
          posts.map((post) => ({
            ...post,
            isPublishing: false,
            isPublished: true,
          })),
        )

        // Show success toast
        toast({
          title: "All Posts Published",
          description: "All your posts have been published successfully.",
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error publishing all posts:", error)

      // Show error toast
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "Failed to publish posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPublishingAll(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f7ff] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#262626] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-[#525252]">Loading campaign results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f7ff]">
      <div className="max-w-5xl mx-auto pb-10">
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
            <h1 className="text-[#262626] font-medium">Campaign Results</h1>
          </div>
        </header>

        <div className="space-y-6 px-4 mt-6">
          {/* Campaign Overview */}
          <div className="border border-[#e5e5e5] rounded-md bg-white p-6">
            <h2 className="text-[#262626] font-medium mb-4">Campaign Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm text-[#525252] font-medium">Business Name</h3>
                <p className="text-[#262626]">{campaignData.businessName}</p>
              </div>

              <div>
                <h3 className="text-sm text-[#525252] font-medium">Campaign Title</h3>
                <p className="text-[#262626]">{campaignData.campaignTitle}</p>
              </div>

              <div>
                <h3 className="text-sm text-[#525252] font-medium">Platforms</h3>
                <p className="text-[#262626]">{campaignData.platforms}</p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="border border-red-300 rounded-md bg-red-50 p-6 text-center">
              <p className="text-red-600">{error}</p>
              <Button className="mt-4 bg-[#262626] hover:bg-[#000000] text-white" onClick={() => router.push("/")}>
                Back to Campaign Generator
              </Button>
            </div>
          )}

          {/* Campaign Content */}
          {!error && posts.length > 0 && (
            <div className="border border-[#e5e5e5] rounded-md bg-white p-6">
              <h2 className="text-[#262626] font-medium mb-4">Campaign Content</h2>

              <div className="space-y-6">
                {/* Post Sections with Image and Content */}
                {posts.map((post) => (
                  <div key={post.rowNum} className="border border-[#e5e5e5] rounded-md p-4">
                    <div className="flex items-center mb-3">
                      <h3 className="text-[#262626] font-medium">{post.platform} Post</h3>
                      <div className="ml-auto flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-[#e5e5e5] hover:bg-[#f5f5f5]"
                          onClick={() => handleRegeneratePost(post.rowNum)}
                          disabled={post.isPublishing}
                        >
                          Regenerate
                        </Button>
                        <Button
                          size="sm"
                          className={`text-xs ${
                            post.isPublished ? "bg-green-600 hover:bg-green-700" : "bg-[#262626] hover:bg-black"
                          }`}
                          onClick={() => handlePublishPost(post.rowNum)}
                          disabled={post.isPublishing || post.isPublished}
                        >
                          {post.isPublishing ? "Publishing..." : post.isPublished ? "Published" : "Publish"}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Image Section */}
                      <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                        <img
                          src={post.mediaUrl || "/placeholder.svg?height=400&width=400"}
                          alt={`${post.platform} post`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content Section */}
                      <div className="flex flex-col">
                        {/* Post Type */}
                        <div className="mb-2">
                          <span className="text-xs font-medium text-[#525252]">Post Type: </span>
                          <span className="text-xs text-[#737373]">{post.platformPostType}</span>
                        </div>

                        {/* Caption (only for Instagram) */}
                        {post.platform.toLowerCase() === "instagram" && post.caption && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-[#525252]">Caption: </span>
                            <span className="text-xs text-[#737373]">{post.caption}</span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="bg-gray-50 p-4 rounded-md flex-grow">
                          <p className="text-[#525252] text-sm whitespace-pre-wrap">{post.content}</p>
                        </div>

                        <div className="mt-2 text-xs text-[#737373] flex justify-between">
                          <p>Character count: {post.content.length}</p>
                          <p>Created: {post.createdDateTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publish All Button - Only show if there are posts */}
          {!error && posts.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button
                className={`${
                  isPublishingAll
                    ? "bg-gray-500"
                    : posts.every((post) => post.isPublished)
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-[#262626] hover:bg-[#000000]"
                } text-white px-8 py-6 text-lg`}
                onClick={handlePublishAll}
                disabled={isPublishingAll || posts.every((post) => post.isPublished)}
              >
                {isPublishingAll
                  ? "Publishing..."
                  : posts.every((post) => post.isPublished)
                    ? "All Posts Published"
                    : "Publish All Posts"}
              </Button>
            </div>
          )}

          {/* No posts message */}
          {!error && posts.length === 0 && (
            <div className="border border-[#e5e5e5] rounded-md bg-white p-6 text-center">
              <p className="text-[#525252]">No content was found for this campaign. Please go back and try again.</p>
              <Button className="mt-4 bg-[#262626] hover:bg-[#000000] text-white" onClick={() => router.push("/")}>
                Back to Campaign Generator
              </Button>
            </div>
          )}

          {/* Footer */}
          <footer className="text-center text-xs text-[#a3a3a3] mt-10">
            © 2025 Campaign Generator. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  )
}
