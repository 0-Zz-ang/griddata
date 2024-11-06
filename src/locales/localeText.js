const localeTexts = {
  en: {
    noRowsLabel: 'No data available',
    footerRowSelected: count => `${count.toLocaleString()} row(s) selected`,
    MuiTablePagination: {
      labelRowsPerPage: 'Rows per page', // 추가된 부분
      labelDisplayedRows: ({ from, to, count }) => `${from}-${to} of ${count}`,
    },
  },
  ko: {
    noRowsLabel: '데이터가 존재하지 않습니다',
    footerRowSelected: count => `${count.toLocaleString()} 행 선택됨`,
    MuiTablePagination: {
      labelRowsPerPage: '페이지당 행 수', // 추가된 부분
      labelDisplayedRows: ({ from, to, count }) => `총 ${count}개 중 ${from}–${to}`,
    },
  },
};

export default localeTexts;
