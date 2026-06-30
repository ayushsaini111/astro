import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

export async function POST(req) {
  try {
    const body = await req.json();

    const username = body.username?.trim();
    const password = body.password?.trim();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const pandit = await prisma.pandit.findUnique({
      where: { username },
    });

    if (!pandit) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    let valid = false;

    try {
      valid = await bcrypt.compare(password, pandit.password);
    } catch {}

    if (!valid && pandit.password === password) {
      valid = true;
    }

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const token = jwt.sign(
      {
        id: pandit.id,
        username: pandit.username,
        role: "pandit",
      },
      process.env.NEXTAUTH_SECRET,
      {
        expiresIn: "30d",
      }
    );

    return NextResponse.json(
      {
        token,
        pandit: {
          id: pandit.id,
          username: pandit.username,
          name: pandit.name,
          profilePic: pandit.profilePic,
          speciality: pandit.speciality,
          ratePerMin: pandit.ratePerMin,
          isAvailable: pandit.isAvailable,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (e) {
    console.log(e);

    return NextResponse.json(
      {
        error: e.message,
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}