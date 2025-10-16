import { StyleSheet } from 'react-native';

const salesOrderStyles = StyleSheet.create({
  container: { flexGrow: 1,  paddingTop: 0, backgroundColor: '#fff' },
  header: { textAlign: 'center', backgroundColor: '#077BC3', color: '#fff', fontSize: 20, padding: 14 , paddingVertical: 16,
    alignItems: "center",},

  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  subHeader: { fontWeight: 'bold', fontSize: 16, marginVertical: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 10, borderRadius: 5 },
  button: { backgroundColor: '#077BC3', padding: 12, borderRadius: 10, marginTop: 20 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  cancelBtn: { padding: 12, borderRadius: 10, marginTop: 20, backgroundColor: '#ccc' },
  cancelText: { textAlign: 'center', fontWeight: 'bold' },
  warning: { color: 'red', fontWeight: 'bold', marginVertical: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  addButton: { backgroundColor: '#077BC3', color: '#fff', padding: 6, borderRadius: 4 },
  summaryBox: { backgroundColor: '#f0f0f0', padding: 10, marginTop: 20 },
  listItem: { borderWidth: 1, padding: 12, marginVertical: 6, borderRadius: 5 },
  fab: { backgroundColor: '#077BC3', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});


export default salesOrderStyles;
