import { walk } from "jsr:@std/fs";
import * as path from "jsr:@std/path";

/**
 * Script Deno quét thư mục bricks và các folder con
 * Tổng hợp nội dung atoms.njk và molecules.njk vào 1 file text
 */

const BRICKS_DIR = "./bricks";
const OUTPUT_FILE = "compiled_bricks_library.txt";

async function exportBricksToText() {
  let combinedContent = "";
  let fileCount = 0;

  console.log(`🚀 Bắt đầu quét thư mục: ${BRICKS_DIR}...`);

  try {
    // Sử dụng walk để quét đệ quy qua toàn bộ thư mục và file [2]
    // Chỉ quan tâm đến các tệp có phần mở rộng .njk [3]
    for await (const entry of walk(BRICKS_DIR, { 
      includeDirs: false, 
      exts: [".njk"] 
    })) {
      const fileName = path.basename(entry.path);

      // Chỉ lọc đúng các file atoms.njk và molecules.njk theo yêu cầu
      if (fileName === "atoms.njk" || fileName === "molecules.njk") {
        // Đọc nội dung tệp tin [2]
        const content = await Deno.readTextFile(entry.path);
        
        // Thêm Header để phân biệt nguồn gốc của các macro khi lưu vào file text
        combinedContent += `\n{# ========================================== #}\n`;
        combinedContent += `{# SOURCE: ${entry.path} #}\n`;
        combinedContent += `{# ========================================== #}\n\n`;
        combinedContent += content + "\n\n";
        
        fileCount++;
        console.log(`[+] Đã nạp: ${entry.path}`);
      }
    }

    if (fileCount > 0) {
      // Ghi toàn bộ nội dung đã tổng hợp vào tệp đầu ra [4]
      await Deno.writeTextFile(OUTPUT_FILE, combinedContent);
      console.log(`\n✨ Thành công! Đã tổng hợp ${fileCount} tệp vào: ${OUTPUT_FILE}`);
    } else {
      console.log("⚠️ Không tìm thấy tệp atoms.njk hoặc molecules.njk nào trong thư mục chỉ định.");
    }

  } catch (error) {
    console.error(`❌ Lỗi trong quá trình xử lý: ${error.message}`);
  }
}

// Thực thi hàm
exportBricksToText();