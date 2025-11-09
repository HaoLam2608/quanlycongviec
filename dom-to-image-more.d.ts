declare module 'dom-to-image-more' {
  interface Options {
    quality?: number
    width?: number
    height?: number
    style?: Record<string, any>
    filter?: (node: any) => boolean
    bgcolor?: string
    cacheBust?: boolean
  }

  export function toPng(node: HTMLElement, options?: Options): Promise<string>
  export function toJpeg(node: HTMLElement, options?: Options): Promise<string>
  export function toSvg(node: HTMLElement, options?: Options): Promise<string>
  export function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>
  export function toCanvas(node: HTMLElement, options?: Options): Promise<HTMLCanvasElement>
  export function toBlob(node: HTMLElement, options?: Options): Promise<Blob>

  const domtoimage: {
    toPng: typeof toPng
    toJpeg: typeof toJpeg
    toSvg: typeof toSvg
    toPixelData: typeof toPixelData
    toCanvas: typeof toCanvas
    toBlob: typeof toBlob
  }

  export default domtoimage
}