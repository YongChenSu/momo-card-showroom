/**
 * Local SVG placeholder (data URI) — mock data must not hotlink real momo assets.
 */
export const placeholderImage = (label: string, hue: number): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
<rect width="400" height="400" fill="hsl(${hue} 70% 92%)"/>
<circle cx="200" cy="170" r="90" fill="hsl(${hue} 60% 70%)"/>
<text x="200" y="330" font-family="sans-serif" font-size="36" text-anchor="middle" fill="hsl(${hue} 50% 30%)">${label}</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
