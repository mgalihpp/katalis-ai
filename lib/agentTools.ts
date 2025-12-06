import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export const AGENT_TOOLS: ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'check_stock',
            description: 'Mengecek ketersediaan stok barang di warung',
            parameters: {
                type: 'object',
                properties: {
                    item_name: {
                        type: 'string',
                        description: 'Nama barang yang ingin dicek (contoh: "beras", "telur", "minyak")',
                    },
                },
                required: ['item_name'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'check_debt',
            description: 'Mengecek total hutang seseorang',
            parameters: {
                type: 'object',
                properties: {
                    debtor_name: {
                        type: 'string',
                        description: 'Nama orang yang punya hutang (contoh: "Bu Tejo", "Pak RT")',
                    },
                },
                required: ['debtor_name'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_today_summary',
            description: 'Melihat ringkasan penjualan dan pembelian hari ini',
            parameters: {
                type: 'object',
                properties: {
                    detailed: {
                        type: 'boolean',
                        description: 'Apakah ingin ringkasan detail (opsional, default: false)',
                    },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_low_stock',
            description: 'Mengecek daftar barang yang stoknya menipis. Bisa atur batas minimum stok.',
            parameters: {
                type: 'object',
                properties: {
                    threshold: {
                        type: 'number',
                        description: 'Batas jumlah stok dianggap menipis (default: 5)',
                    },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_top_selling',
            description: 'Melihat barang paling laku terjual hari ini. Bisa atur jumlah barang yang ditampilkan.',
            parameters: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number',
                        description: 'Jumlah barang terlaris yang ingin dilihat (default: 5)',
                    },
                },
            },
        },
    },
];

export const AGENT_SYSTEM_PROMPT = `Kamu adalah "Asisten Warung Pintar" untuk aplikasi Katalis AI. Kamu adalah AI agent yang memiliki akses ke data warung REAL-TIME melalui function tools.

ATURAN PENTING:
1. **WAJIB GUNAKAN TOOLS** untuk pertanyaan tentang data warung. JANGAN pernah menebak atau berhalusinasi angka/data.
2. Jika user bertanya tentang data, LANGSUNG panggil tool yang sesuai:
   
   ✅ "stok beras masih ada?" → CALL check_stock({"item_name": "beras"})
   ✅ "barang apa yang stoknya menipis?" → CALL get_low_stock({ "threshold": 5 })
   ✅ "barang apa yang paling laku hari ini?" → CALL get_top_selling({ "limit": 5 })
   ✅ "hutang Bu Tejo berapa?" → CALL check_debt({"debtor_name": "Bu Tejo"})
   ✅ "omset hari ini berapa?" → CALL get_today_summary({ "detailed": false })
   ✅ "ringkasan hari ini" → CALL get_today_summary({ "detailed": false })
   ✅ "laporan penjualan detail hari ini" → CALL get_today_summary({ "detailed": true })

3. Setelah dapat hasil dari tool, jelaskan ke user dengan bahasa santai dan ramah.
4. Kalau user hanya menyapa atau ngobrol biasa (bukan tentang data), jawab langsung tanpa tool.

TOOLS YANG TERSEDIA:
- check_stock: Cek stok barang tertentu
- check_debt: Cek hutang pelanggan  
- get_today_summary: Lihat ringkasan penjualan & pembelian hari ini
- get_low_stock: Lihat barang yang stoknya menipis
- get_top_selling: Lihat barang paling laris hari ini

Contoh:
User: "Minyak goreng masih ada ga?"
→ PANGGIL check_stock({"item_name": "minyak goreng"})
→ Hasil: {"name": "Minyak Goreng", "quantity": 3, "unit": "liter"}
→ Jawab: "Masih ada kok, sisa 3 liter minyak gorengnya 👍"

INGAT: Kalau pertanyaan tentang DATA, PASTI pakai tool!`;
