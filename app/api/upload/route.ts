import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Image upload is not configured" },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    // Convert file to base64 as fallback
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    // Try to upload to Supabase first
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const fileName = `bahagi/${crypto.randomUUID()}.${file.name.split(".").pop()}`;

      const { data, error } = await supabase.storage
        .from("lesson-images")
        .upload(fileName, buffer, {
          contentType: file.type,
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("lesson-images")
        .getPublicUrl(data.path);

      return NextResponse.json({ url: publicUrl });
    } catch (storageError: any) {
      const errorMsg = storageError?.message || 'Unknown error';
      
      console.warn('Supabase storage failed, using fallback:', errorMsg);

      // Fallback: Return base64 data URL for temporary use
      // This allows the form to work while storage is being fixed
      if (errorMsg.includes('Bucket not found') || errorMsg.includes('permission')) {
        return NextResponse.json({
          url: dataUrl,
          isTemporary: true,
          warning: "Using temporary image storage. To save images permanently, please configure Supabase storage."
        });
      }

      throw storageError;
    }
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload image",
        details: error.message,
        suggestion: "Image storage is not properly configured. The form allows creating Bahagi without an image - you can add images later."
      }, 
      { status: 500 }
    );
  }
}
