import { NextRequest, NextResponse } from "next/server";

const ALLOWED_IMAGE_HOSTS = [
  "ibyteimg.com",
  "tiktokcdn.com",
  "tiktok.com",
  "shopee.com.my",
  "shopee.sg",
  "shopee.co.id",
  "shopee.ph",
  "alicdn.com",
  "lazcdn.com",
  "lazada.com.my",
  "supabase.co",
];

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  const rawReferer = request.nextUrl.searchParams.get("referer");

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing image url." }, { status: 400 });
  }

  let imageUrl: URL;

  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid image url." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(imageUrl.protocol) || !isAllowedImageHost(imageUrl.hostname)) {
    return NextResponse.json({ error: "Image host is not allowed." }, { status: 400 });
  }

  const referer = getReferer(rawReferer, imageUrl);

  const imageResponse = await fetch(imageUrl.toString(), {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: referer,
      Origin: new URL(referer).origin,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    },
    cache: "force-cache",
  });

  if (!imageResponse.ok || !imageResponse.body) {
    return NextResponse.json(
      { error: `Image fetch failed with status ${imageResponse.status}.` },
      { status: imageResponse.status || 502 },
    );
  }

  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

  return new NextResponse(imageResponse.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
    },
  });
}

function isAllowedImageHost(hostname: string) {
  const normalized = hostname.toLowerCase();

  return ALLOWED_IMAGE_HOSTS.some(
    (allowedHost) => normalized === allowedHost || normalized.endsWith(`.${allowedHost}`),
  );
}

function getReferer(rawReferer: string | null, imageUrl: URL) {
  if (rawReferer) {
    try {
      const refererUrl = new URL(rawReferer);
      if (["http:", "https:"].includes(refererUrl.protocol)) {
        return refererUrl.toString();
      }
    } catch {
      // Fall back to a marketplace-like referer below.
    }
  }

  if (imageUrl.hostname.includes("ibyteimg.com") || imageUrl.hostname.includes("tiktok")) {
    return "https://www.tiktok.com/shop/";
  }

  if (imageUrl.hostname.includes("shopee")) {
    return "https://shopee.com.my/";
  }

  if (imageUrl.hostname.includes("lazada") || imageUrl.hostname.includes("lazcdn")) {
    return "https://www.lazada.com.my/";
  }

  return imageUrl.origin;
}
