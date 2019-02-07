export default ({ children }) => (
  <button
    style={{
      border: "1px solid #428bca",
      borderRadius: "3px",
      color: "#428bca",
      fontSize: '1.1em',
      padding: '0.4em 1em',
      backgroundColor: "transparent",
      cursor: 'pointer'
    }}
  >
    {children}
  </button>
)