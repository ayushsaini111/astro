// backend/src/app/api/user/profile/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to get user from headers
function getUserFromHeaders(request) {
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  const userName = request.headers.get('x-user-name');
  
  if (!userId) {
    return null;
  }
  
  return { id: userId, email: userEmail, name: userName };
}

export async function GET(request) {
  try {
    const user = getUserFromHeaders(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        dob: true,
        gender: true,
        houseNo: true,
        address: true,
        landmark: true,
        pinCode: true,
        provider: true,
        isProfileCompleted: true,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = getUserFromHeaders(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get('content-type');
    let updateData = {};

    // Handle JSON data
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      const { name, email, phone, dob, gender, houseNo, address, landmark, pinCode } = body;

      if (name) updateData.name = name.trim();
      if (email) updateData.email = email.trim().toLowerCase();
      if (phone) updateData.phone = phone.trim();
      if (dob) updateData.dob = new Date(dob);
      if (gender) updateData.gender = gender;
      if (houseNo !== undefined) updateData.houseNo = houseNo;
      if (address !== undefined) updateData.address = address;
      if (landmark !== undefined) updateData.landmark = landmark;
      if (pinCode !== undefined) updateData.pinCode = pinCode;
    }
    // Handle FormData (for image uploads)
    else if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Handle image upload
      const imageFile = formData.get("image");
      if (imageFile && imageFile.size > 0) {
        // Validate file size (5MB)
        if (imageFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Image size should be less than 5MB" },
            { status: 400 }
          );
        }

        // Get existing user to delete old image
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { image: true },
        });

        // Delete old image if exists
        if (existingUser?.image) {
          const { deleteImageFromCloudinary } = await import("@/lib/cloudinary");
          await deleteImageFromCloudinary(existingUser.image);
        }

        // Upload new image
        const cloudinary = (await import("@/lib/cloudinary")).default;
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = `data:${imageFile.type};base64,${buffer.toString("base64")}`;

        const uploaded = await cloudinary.uploader.upload(base64, {
          folder: "rantraa/profiles",
          transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }],
        });

        updateData.image = uploaded.secure_url;
      }

      // Handle other form fields
      const name = formData.get("name");
      const email = formData.get("email");
      const phone = formData.get("phone");
      const dob = formData.get("dob");
      const gender = formData.get("gender");
      const houseNo = formData.get("houseNo");
      const address = formData.get("address");
      const landmark = formData.get("landmark");
      const pinCode = formData.get("pinCode");

      if (name) updateData.name = name.trim();
      if (email) updateData.email = email.trim().toLowerCase();
      if (phone) updateData.phone = phone.trim();
      if (dob) updateData.dob = new Date(dob);
      if (gender) updateData.gender = gender;
      if (houseNo !== undefined) updateData.houseNo = houseNo;
      if (address !== undefined) updateData.address = address;
      if (landmark !== undefined) updateData.landmark = landmark;
      if (pinCode !== undefined) updateData.pinCode = pinCode;
    }

    // Validate email uniqueness if updating
    if (updateData.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          NOT: { id: user.id }
        }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    }

    // Validate phone uniqueness if updating
    if (updateData.phone) {
      const phoneExists = await prisma.user.findFirst({
        where: {
          phone: updateData.phone,
          NOT: { id: user.id }
        }
      });

      if (phoneExists) {
        return NextResponse.json(
          { error: "Phone number already in use" },
          { status: 400 }
        );
      }
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}