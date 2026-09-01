<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdateInvoiceRequest;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly InvoiceService $invoiceService,
    ) {}

    private function findInvoice(int $id, int $tenantId): Invoice
    {
        $invoice = Invoice::withoutTenant()
            ->where('tenant_id', $tenantId)
            ->find($id);

        if (! $invoice) {
            abort(404, 'Invoice not found.');
        }

        return $invoice;
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);

        $query = Invoice::with(['customer', 'payments'])
            ->where('tenant_id', $request->user()->tenant_id);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('number', 'ilike', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'ilike', "%{$search}%");
                    });
            });
        }

        $paginator = $query->orderByDesc('id')->paginate($perPage);

        $items = $paginator->getCollection()->map(function (Invoice $invoice) {
            return $this->enrichInvoice($invoice);
        });

        return $this->success($items, [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        $invoice = $this->invoiceService->create(
            $request->validated(),
            $request->user()->tenant_id,
            $request->user()->id,
        );

        return $this->created($this->enrichInvoice($invoice));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $invoice = $this->findInvoice($id, $request->user()->tenant_id);

        $invoice->load(['customer', 'lines.product', 'payments']);

        return $this->success($this->enrichInvoice($invoice));
    }

    public function update(UpdateInvoiceRequest $request, int $id): JsonResponse
    {
        $invoice = $this->findInvoice($id, $request->user()->tenant_id);

        if ($invoice->status !== 'draft') {
            return $this->error(
                [['field' => 'status', 'message' => 'Only draft invoices can be edited.']],
                null,
                422,
            );
        }

        $invoice = $this->invoiceService->update(
            $invoice,
            $request->validated(),
            $request->user()->id,
        );

        return $this->success($this->enrichInvoice($invoice));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $invoice = $this->findInvoice($id, $request->user()->tenant_id);

        $this->invoiceService->delete($invoice);

        return response()->json([
            'data' => null,
            'meta' => (object) [],
            'errors' => [],
        ], 200);
    }

    public function send(Request $request, int $id): JsonResponse
    {
        $invoice = $this->findInvoice($id, $request->user()->tenant_id);

        $invoice = $this->invoiceService->markAsSent($invoice);

        return $this->success($this->enrichInvoice($invoice));
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $invoice = $this->findInvoice($id, $request->user()->tenant_id);

        $invoice = $this->invoiceService->cancel($invoice);

        return $this->success($this->enrichInvoice($invoice));
    }

    public function pdf(Request $request, int $id)
    {
        $invoice = $this->findInvoice($id, $request->user()->tenant_id);

        $invoice->load(['customer', 'lines.product', 'tenant']);

        $pdf = Pdf::loadView('invoices.pdf', ['invoice' => $invoice]);

        return $pdf->stream("{$invoice->number}.pdf");
    }

    public function storePayment(StorePaymentRequest $request, int $id): JsonResponse
    {
        $invoice = $this->findInvoice($id, $request->user()->tenant_id);

        $payment = $this->invoiceService->createPayment(
            $invoice,
            $request->validated(),
            $request->user()->id,
        );

        $invoice->refresh()->load(['customer', 'lines', 'payments']);

        return $this->created([
            'payment' => $payment,
            'invoice' => $this->enrichInvoice($invoice),
        ]);
    }

    private function enrichInvoice(Invoice $invoice): array
    {
        $data = $invoice->toArray();

        $paidSum = $invoice->payments()->sum('amount');
        $remaining = $invoice->total - $paidSum;

        $data['paid_amount'] = $paidSum;
        $data['remaining_amount'] = max(0, $remaining);

        if (in_array($invoice->status, ['sent', 'partially_paid']) && $invoice->due_date < now()->toDateString()) {
            $data['display_status'] = 'overdue';
        } else {
            $data['display_status'] = $invoice->status;
        }

        return $data;
    }
}
