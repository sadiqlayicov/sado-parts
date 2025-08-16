import { NextResponse } from 'next/server';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

type InvoiceData = {
  order: {
    orderNumber: string;
    createdAt: string;
    totalAmount: number;
    items: Array<{ name: string; sku: string; quantity: number; price: number; totalPrice: number }>;
  };
  supplier: {
    companyName: string;
    companyAddress: string;
    inn: string;
    kpp: string;
    bik: string;
    accountNumber: string;
    bankName: string;
    bankBik: string;
    bankAccountNumber: string;
  };
  customer: {
    name: string;
    email?: string;
    inn?: string;
    country?: string;
    city?: string;
    address?: string;
  };
};

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },
  title: { fontSize: 18, textAlign: 'center', marginBottom: 8 },
  row: { flexDirection: 'row' },
  col: { flex: 1, padding: 6, border: '1px solid #000' },
  tableHeader: { backgroundColor: '#eee', fontWeight: 700 },
  tableCell: { border: '1px solid #000', padding: 4 },
});

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const doc = (
    <Document>
      <Page style={styles.page} size="A4">
        <Text style={styles.title}>СЧЕТ-ФАКТУРА</Text>
        <Text style={{ textAlign: 'center', marginBottom: 8 }}>№ {data.order.orderNumber} от {new Date(data.order.createdAt).toLocaleDateString('ru-RU')}</Text>

        <View style={[styles.row]}> 
          <View style={[styles.col]}> 
            <Text>Поставщик:</Text>
            <Text>{data.supplier.companyName}</Text>
            <Text>{data.supplier.companyAddress}</Text>
            <Text>ИНН: {data.supplier.inn}</Text>
            <Text>КПП: {data.supplier.kpp}</Text>
            <Text>БИК: {data.supplier.bik}</Text>
            <Text>Счет №: {data.supplier.accountNumber}</Text>
            <Text>Банк: {data.supplier.bankName}</Text>
            <Text>БИК банка: {data.supplier.bankBik}</Text>
            <Text>Корр. счет: {data.supplier.bankAccountNumber}</Text>
          </View>
          <View style={[styles.col]}> 
            <Text>Покупатель:</Text>
            <Text>{data.customer.name}</Text>
            {data.customer.inn ? <Text>ИНН: {data.customer.inn}</Text> : null}
            {data.customer.country ? <Text>Страна: {data.customer.country}</Text> : null}
            {data.customer.city ? <Text>Город: {data.customer.city}</Text> : null}
            {data.customer.address ? <Text>Адрес: {data.customer.address}</Text> : null}
            {data.customer.email ? <Text>Email: {data.customer.email}</Text> : null}
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <View style={[styles.row, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>№</Text>
            <Text style={[styles.tableCell, { flex: 3 }]}>Товар (Услуга)</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>Код</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>Кол-во</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>Цена</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>Сумма</Text>
          </View>
          {data.order.items.map((it, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={[styles.tableCell, { flex: 0.6 }]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>{it.name}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{it.sku}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{it.quantity}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{it.price.toFixed(2)}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{it.totalPrice.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
          <Text>Итого: {data.order.totalAmount.toFixed(2)} ₽</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBuffer();
  return blob as unknown as Uint8Array;
}


