import Foundation
import Vision
import PDFKit
import AppKit
let args = CommandLine.arguments
let url = URL(fileURLWithPath: args[1])
let maxPages = args.count > 2 ? Int(args[2])! : 4
guard let doc = PDFDocument(url: url) else { exit(1) }
var out = ""
for i in 0..<min(doc.pageCount, maxPages) {
  guard let page = doc.page(at: i) else { continue }
  let b = page.bounds(for: .mediaBox)
  let scale: CGFloat = 2.5
  let w = Int(b.width*scale), h = Int(b.height*scale)
  let cs = CGColorSpaceCreateDeviceRGB()
  guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { continue }
  ctx.setFillColor(CGColor(red:1,green:1,blue:1,alpha:1)); ctx.fill(CGRect(x:0,y:0,width:w,height:h))
  ctx.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: ctx)
  guard let img = ctx.makeImage() else { continue }
  let req = VNRecognizeTextRequest()
  req.recognitionLevel = .accurate
  req.usesLanguageCorrection = true
  try? VNImageRequestHandler(cgImage: img, options: [:]).perform([req])
  let obs = (req.results ?? []).sorted { a, b in
    let ya = a.boundingBox.midY, yb = b.boundingBox.midY
    if abs(ya - yb) > 0.008 { return ya > yb }
    return a.boundingBox.minX < b.boundingBox.minX }
  var lastY: CGFloat = -1
  var line = ""
  for o in obs {
    let t = o.topCandidates(1).first?.string ?? ""
    if lastY >= 0 && abs(o.boundingBox.midY - lastY) > 0.008 { out += line + "\n"; line = "" }
    line += (line.isEmpty ? "" : "   ") + t
    lastY = o.boundingBox.midY
  }
  out += line + "\n\u{0C}\n"
}
print(out)
