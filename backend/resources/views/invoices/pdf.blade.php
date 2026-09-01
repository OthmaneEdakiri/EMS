<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $invoice->number }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        .company-name {
            font-size: 22px;
            font-weight: bold;
            color: #2563eb;
        }
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            text-align: right;
        }
        .invoice-number {
            font-size: 14px;
            color: #666;
            text-align: right;
        }
        .meta-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .meta-box {
            width: 48%;
        }
        .meta-box h3 {
            font-size: 11px;
            text-transform: uppercase;
            color: #888;
            margin: 0 0 8px 0;
            letter-spacing: 1px;
        }
        .meta-box p {
            margin: 2px 0;
            font-size: 12px;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-draft { background: #f3f4f6; color: #6b7280; }
        .status-sent { background: #dbeafe; color: #2563eb; }
        .status-partially_paid { background: #fef3c7; color: #d97706; }
        .status-paid { background: #d1fae5; color: #059669; }
        .status-cancelled { background: #fee2e2; color: #dc2626; }
        .status-overdue { background: #fee2e2; color: #dc2626; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        thead th {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px 8px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
        }
        tbody td {
            border: 1px solid #e2e8f0;
            padding: 10px 8px;
            font-size: 12px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        .totals-table {
            width: 300px;
        }
        .totals-table tr td {
            padding: 6px 10px;
            font-size: 12px;
        }
        .totals-table tr td:last-child {
            text-align: right;
            font-weight: bold;
        }
        .totals-table .total-row td {
            border-top: 2px solid #2563eb;
            font-size: 14px;
            font-weight: bold;
            color: #2563eb;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 10px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company-name">{{ $invoice->tenant->name ?? 'Company' }}</div>
        </div>
        <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">{{ $invoice->number }}</div>
        </div>
    </div>

    <div class="meta-section">
        <div class="meta-box">
            <h3>Bill To</h3>
            <p><strong>{{ $invoice->customer->name }}</strong></p>
            @if($invoice->customer->email)
                <p>{{ $invoice->customer->email }}</p>
            @endif
            @if($invoice->customer->address)
                <p>{{ $invoice->customer->address }}</p>
            @endif
            @if($invoice->customer->tax_id)
                <p>Tax ID: {{ $invoice->customer->tax_id }}</p>
            @endif
        </div>
        <div class="meta-box">
            <h3>Invoice Details</h3>
            <table style="width: 100%; border: none;">
                <tr>
                    <td style="border: none; padding: 2px 0; width: 100px;">Status</td>
                    <td style="border: none; padding: 2px 0;">
                        <span class="status-badge status-{{ $invoice->status }}">
                            {{ ucfirst(str_replace('_', ' ', $invoice->status)) }}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td style="border: none; padding: 2px 0;">Issue Date</td>
                    <td style="border: none; padding: 2px 0;">{{ \Carbon\Carbon::parse($invoice->issue_date)->format('M d, Y') }}</td>
                </tr>
                <tr>
                    <td style="border: none; padding: 2px 0;">Due Date</td>
                    <td style="border: none; padding: 2px 0;">{{ \Carbon\Carbon::parse($invoice->due_date)->format('M d, Y') }}</td>
                </tr>
            </table>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 5%">#</th>
                <th style="width: 40%">Description</th>
                <th style="width: 10%" class="text-center">Qty</th>
                <th style="width: 15%" class="text-right">Unit Price</th>
                <th style="width: 10%" class="text-right">Tax</th>
                <th style="width: 20%" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->lines as $index => $line)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ $line->description }}</td>
                <td class="text-center">{{ number_format($line->qty, 2) }}</td>
                <td class="text-right">{{ number_format($line->unit_price, 2) }}</td>
                <td class="text-right">{{ $line->tax_rate ? number_format($line->tax_rate, 2) . '%' : '-' }}</td>
                <td class="text-right">{{ number_format($line->line_total, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table class="totals-table">
            <tr>
                <td>Subtotal</td>
                <td>{{ number_format($invoice->subtotal, 2) }}</td>
            </tr>
            <tr>
                <td>Tax</td>
                <td>{{ number_format($invoice->tax_total, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td>Total</td>
                <td>{{ number_format($invoice->total, 2) }}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>Generated on {{ now()->format('M d, Y \a\t h:i A') }}</p>
    </div>
</body>
</html>
