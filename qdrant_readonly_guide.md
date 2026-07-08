# Panduan Penggunaan Qdrant Client (Read-Only)

Dokumen ini menjelaskan cara menggunakan data dari container Qdrant yang sudah berjalan sebagai client **read-only**. Qdrant mendukung pembatasan hak akses menggunakan dua jenis API Key: **Admin API Key** (akses penuh) dan **Read-Only API Key** (hanya baca).

Berdasarkan konfigurasi Docker Anda:
* **Host Port (REST / HTTP)**: `6333`
* **Host Port (gRPC)**: `6334`
* **Admin API Key**: `tVyqRcbkZMKWTVIRTnqVTopXZTovDb` (Akses penuh/Write)
* **Read-Only API Key**: `sZjjtFrVfIXAMOtkkAukBpXSHjZZvo` (Hanya Baca/Read-Only)
* **IP Jaringan Tailscale**: `100.101.143.95`

Dengan menggunakan **Read-Only API Key** (`sZjjtFrVfIXAMOtkkAukBpXSHjZZvo`), aplikasi client Anda dapat melakukan pencarian (*search*), query, mengambil data (*points*), dan melihat informasi koleksi, namun akan ditolak (`403 Forbidden`) jika mencoba mengubah data atau struktur database (seperti membuat koleksi baru atau menambahkan poin baru).

---

## 1. Konfigurasi URL Koneksi (Tailscale & Docker Network)

Karena aplikasi client berjalan di container yang **berbeda** dan **tidak berada dalam satu Docker Network** yang sama, Anda **tidak bisa** menggunakan `localhost` atau nama container (`qdrant`) sebagai URL tujuan dari dalam container client tersebut.

Namun, karena server berada di jaringan **Tailscale**, Anda dapat menggunakan IP Tailscale dari host Qdrant:

### Menggunakan IP Tailscale Host (Direkomendasikan)
Karena container Qdrant dipublikasikan menggunakan parameter `-p 6333:6333 -p 6334:6334`, port tersebut terikat ke semua interface jaringan host (termasuk interface Tailscale). 

Dengan IP Tailscale Qdrant **`100.101.143.95`**, gunakan URL berikut pada aplikasi client Anda:
* **REST / HTTP URL**: `http://100.101.143.95:6333`
* **gRPC URL**: `100.101.143.95` (Port `6334`)

*(Catatan: Anda juga bisa memanfaatkan IP gateway Docker host `172.17.0.1` atau alias `host.docker.internal` jika container client dijalankan pada server fisik yang sama).*

---

## 2. Menggunakan REST API (cURL)

Anda dapat mengakses Qdrant REST API secara langsung dengan menyertakan header HTTP `api-key`.

### A. Mendapatkan Daftar Koleksi (List Collections)
```bash
curl -X GET "http://100.101.143.95:6333/collections" \
  -H "api-key: sZjjtFrVfIXAMOtkkAukBpXSHjZZvo"
```

### B. Mengambil Informasi Detail Koleksi
```bash
curl -X GET "http://100.101.143.95:6333/collections/{nama_koleksi}" \
  -H "api-key: sZjjtFrVfIXAMOtkkAukBpXSHjZZvo"
```

### C. Melakukan Pencarian Vector (Vector Search)
```bash
curl -X POST "http://100.101.143.95:6333/collections/{nama_koleksi}/points/search" \
  -H "api-key: sZjjtFrVfIXAMOtkkAukBpXSHjZZvo" \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.05, 0.61, 0.76, 0.32],
    "limit": 3,
    "with_payload": true,
    "with_vector": false
  }'
```

---

## 3. Menggunakan Node.js / TypeScript Client

Gunakan package resmi `@qdrant/js-client-rest` untuk aplikasi Javascript/TypeScript.

### Instalasi SDK
```bash
npm install @qdrant/js-client-rest
```

### Contoh Kode Client (Read-Only)
```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

// Inisialisasi client dengan Read-Only API Key dan IP Tailscale
const qdrantClient = new QdrantClient({
  url: 'http://100.101.143.95:6333',
  apiKey: 'sZjjtFrVfIXAMOtkkAukBpXSHjZZvo'
});

async function readFromQdrant() {
  const collectionName = 'nama_koleksi_anda';

  try {
    // 1. Dapatkan informasi koleksi
    const info = await qdrantClient.getCollection(collectionName);
    console.log('Status Koleksi:', info.status);

    // 2. Lakukan pencarian vector (Read operation - Diizinkan)
    const searchResult = await qdrantClient.search(collectionName, {
      vector: [0.1, 0.2, 0.3, 0.4], // Sesuaikan dimensi dengan koleksi Anda
      limit: 5,
      filter: {
        must: [
          {
            key: 'status',
            match: { value: 'active' }
          }
        ]
      }
    });
    console.log('Hasil Pencarian:', searchResult);

  } catch (error) {
    console.error('Error saat membaca data:', error);
  }
}

readFromQdrant();
```

---

## 4. Menggunakan Python Client

Gunakan library resmi `qdrant-client` untuk aplikasi berbasis Python. Library ini mendukung koneksi REST (HTTP) maupun gRPC (lebih cepat untuk data dalam jumlah besar).

### Instalasi SDK
```bash
pip install qdrant-client
```

### Contoh Kode Client (gRPC & HTTP)
```python
from qdrant_client import QdrantClient

# Hubungkan via REST API (Port 6333)
client_http = QdrantClient(
    url="http://100.101.143.95",
    port=6333,
    api_key="sZjjtFrVfIXAMOtkkAukBpXSHjZZvo"
)

# Hubungkan via gRPC (Port 6334) - Direkomendasikan untuk performa tinggi
client_grpc = QdrantClient(
    url="http://100.101.143.95",
    grpc_port=6334,
    prefer_grpc=True,
    api_key="sZjjtFrVfIXAMOtkkAukBpXSHjZZvo"
)

def search_data(client, collection_name):
    try:
        # Melakukan pencarian (Read Operation)
        results = client.search(
            collection_name=collection_name,
            query_vector=[0.1, 0.2, 0.3, 0.4], # Sesuaikan dimensi
            limit=5
        )
        for result in results:
            print(f"ID: {result.id}, Score: {result.score}, Payload: {result.payload}")
    except Exception as e:
        print(f"Gagal melakukan pencarian: {e}")

# Jalankan pencarian menggunakan salah satu client
search_data(client_grpc, "nama_koleksi_anda")
```

---

## 5. Pembatasan Keamanan (Uji Coba Read-Only)

Jika client mencoba melakukan perubahan data menggunakan key read-only, Qdrant akan menolak dengan error `403 Forbidden`. Berikut adalah visualisasi respons jika terjadi penolakan.

### Contoh Penolakan saat Mengubah Data (Upsert Points)
```typescript
try {
  // Mencoba menambahkan point baru dengan Read-Only API Key
  await qdrantClient.upsert('nama_koleksi_anda', {
    wait: true,
    points: [
      { id: 1, vector: [0.1, 0.2, 0.3, 0.4], payload: { info: 'test' } }
    ]
  });
} catch (error: any) {
  // Qdrant akan mengembalikan status 403 (Forbidden)
  console.log('Error:', error.status); // 403
  console.log('Pesan:', error.message); // Forbidden: Access denied. Write operations are not allowed.
}
```

> [!IMPORTANT]
> Pastikan aplikasi utama yang bertugas untuk melakukan ingesting data (memasukkan/memperbarui data) tetap menggunakan Admin API Key (`tVyqRcbkZMKWTVIRTnqVTopXZTovDb`), sedangkan aplikasi pembaca/consumer (seperti chatbot atau antarmuka pencarian) menggunakan Read-Only API Key (`sZjjtFrVfIXAMOtkkAukBpXSHjZZvo`) demi alasan keamanan.
