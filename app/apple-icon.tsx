import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

function ClubMark() {
  return (
    <svg
      width="152"
      height="152"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
      <g fill="#0a0a0a">
        <circle cx="50" cy="28" r="18" />
        <circle cx="32" cy="48" r="18" />
        <circle cx="68" cy="48" r="18" />
        <path d="M42 56c0 10-4 18-12 32h40c-8-14-12-22-12-32 0-4-16-4-16 0Z" />
      </g>

      <g fill="#ffffff">
        <circle cx="50" cy="52" r="7.5" />
        <path d="M46 58h8v18c0 3-2 5-4 5s-4-2-4-5V58Z" />
      </g>
    </svg>
  )
}

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '180px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        <ClubMark />
      </div>
    ),
    size
  )
}

