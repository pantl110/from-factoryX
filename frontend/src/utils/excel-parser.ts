import * as XLSX from 'xlsx';

export interface ExcelRow {
  [key: string]: any;
}

export const parseExcelFile = (file: File): Promise<ExcelRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 첫 번째 시트를 가져옴
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        });
        
        if (jsonData.length < 2) {
          reject(new Error('업로드할 데이터가 없습니다.'));
          return;
        }
        
        // 첫 번째 행을 헤더로 사용
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        // 헤더와 데이터를 매핑하여 객체 배열 생성
        const result: ExcelRow[] = rows.map((row) => {
          const obj: ExcelRow = {};
          headers.forEach((header, index) => {
            if (header && row[index] !== undefined) {
              obj[header.trim()] = row[index];
            }
          });
          return obj;
        });
        
        resolve(result);
      } catch (error) {
        reject(new Error('엑셀 파일 파싱에 실패했습니다.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('파일 읽기에 실패했습니다.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};
