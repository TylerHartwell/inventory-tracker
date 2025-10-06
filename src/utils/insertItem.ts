import { Session } from "@supabase/supabase-js"
import { uploadImage } from "./uploadImage"
import { supabase } from "@/supabase-client"

interface Item {
  id: string
  itemName: string
  extraDetails: string
  image_url: string | null
  signedUrl: string | null
  created_at: string
}

export interface InsertItemParams {
  session: Session
  itemName: string
  extraDetails?: string
  itemImage?: File | null
}

export const insertItem = async ({ session, itemName, extraDetails = "", itemImage }: InsertItemParams): Promise<Item | null> => {
  if (!session.user) {
    console.error("Not authenticated")
    return null
  }

  if (!itemName.trim()) {
    console.error("Item Name is required.")
    return null
  }

  try {
    let imageUrl: string | null = null

    if (itemImage) {
      imageUrl = await uploadImage(session, itemImage)
    }

    const { data: insertedItem, error } = await supabase
      .from("items")
      .insert({ item_name: itemName, extra_details: extraDetails, image_url: imageUrl ?? "" })
      .select("*")
      .single()

    if (error || !insertedItem) {
      console.error("Error adding item: ", error?.message, session)
      return null
    }

    // Generate signed URL if image exists
    let signedUrl: string | null = null
    if (insertedItem.image_url) {
      const { data, error } = await supabase.storage.from("images").createSignedUrl(insertedItem.image_url, 60 * 20)
      if (!error && data) signedUrl = data.signedUrl
    }

    return { ...insertedItem, signedUrl }
  } catch (err) {
    console.error("Unexpected error:", err)
    return null
  }
}
