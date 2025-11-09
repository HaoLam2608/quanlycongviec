# Fonts cho PDF Export

## Hướng dẫn cài đặt font tiếng Việt

### Option 1: Sử dụng font Windows (Khuyến nghị)
Code đã tự động sử dụng font Arial từ `C:/Windows/Fonts/arial.ttf`

### Option 2: Download font Roboto
1. Truy cập: https://fonts.google.com/specimen/Roboto
2. Download font Roboto Regular (.ttf)
3. Copy file vào thư mục này với tên `Roboto-Regular.ttf`

### Option 3: Download DejaVu Sans
1. Truy cập: https://dejavu-fonts.github.io/Download.html
2. Download DejaVuSans.ttf
3. Copy vào thư mục này

## Sử dụng trong code

```javascript
const fontPath = path.join(__dirname, '../fonts/Roboto-Regular.ttf');
doc.font(fontPath);
```

## Font hiện tại
- Windows: Arial (C:/Windows/Fonts/arial.ttf)
- Fallback: Helvetica (built-in PDFKit)
