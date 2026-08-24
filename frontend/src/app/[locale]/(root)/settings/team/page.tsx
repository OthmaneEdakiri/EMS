"use client";

import {
  useLegacyTable,
  getCoreRowModel,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { flexRender } from "@tanstack/react-table";
import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { Users, UserPlus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { useUserContext } from "@/contexts/user-context";
import {
  getStaffUsersAction,
  createStaffUserAction,
  deleteStaffUserAction,
} from "@/actions/auth";

interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: "owner" | "staff";
  created_at: string;
}

const TeamPage = () => {
  const t = useTranslations("team");
  const { user } = useUserContext();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const result = await getStaffUsersAction();
    if (result.status === 200 && result.data) {
      setUsers(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (values: Record<string, any>) => {
    setCreating(true);
    try {
      const result = await createStaffUserAction(values);
      if (result?.status === 201 && result.data) {
        toast.success(t("toast.createSuccess"));
        setUsers((prev) => [...prev, result.data!]);
        setShowForm(false);
      } else if (result?.status === 422) {
        if (result.errors) {
          Object.values(result.errors).forEach((err: any) => {
            toast.error(err[0]);
          });
        }
      } else {
        toast.error(result?.message || t("toast.error"));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId: number) => {
    setDeletingId(userId);
    try {
      const result = await deleteStaffUserAction(userId);
      if (result?.status === 204) {
        toast.success(t("toast.deleteSuccess"));
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        toast.error(result?.message || t("toast.error"));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const allUsers: StaffUser[] = user
    ? [
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: "",
        },
        ...users,
      ]
    : users;

  const columns: LegacyColumnDef<StaffUser, any>[] = [
    {
      accessorKey: "name",
      header: t("columns.name"),
    },
    {
      accessorKey: "email",
      header: t("columns.email"),
    },
    {
      accessorKey: "role",
      header: t("columns.role"),
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
          {t(`roles.${row.original.role}`)}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: t("columns.createdAt"),
      cell: ({ row }) => {
        if (!row.original.created_at) return "—";
        return new Date(row.original.created_at).toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: t("columns.actions"),
      cell: ({ row }) => {
        const u = row.original;
        if (u.role === "owner") return null;
        return (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="ghost" size="icon-xs" />}>
              <Trash2 className="size-3 text-destructive" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("delete.confirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("delete.confirmDescription", { name: u.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("delete.cancelButton")}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={deletingId === u.id}
                  onClick={() => handleDelete(u.id)}
                >
                  {deletingId === u.id ? <Loader /> : t("delete.confirmButton")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      },
    },
  ];

  const table = useLegacyTable({
    data: allUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("description")}
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <UserPlus className="size-4" />
              {t("addUser")}
            </Button>
          </div>

          {showForm && (
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="size-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">{t("addUserTitle")}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowForm(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {t("addUserDescription")}
              </p>
              <AddUserForm onSubmit={handleCreate} loading={creating} />
            </div>
          )}

          <div className="rounded-lg border bg-card">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader />
              </div>
            ) : allUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Users className="size-10 text-muted-foreground/50" />
                <h3 className="text-sm font-medium">{t("empty.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("empty.description")}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

const AddUserForm = ({
  onSubmit,
  loading,
}: {
  onSubmit: (values: Record<string, any>) => Promise<void>;
  loading: boolean;
}) => {
  const t = useTranslations("team");

  return (
    <Form onFormSubmit={onSubmit} className="flex flex-col gap-4">
      <Field.Root
        name="name"
        validate={(value) => {
          if (typeof value !== "string" || value.length === 0)
            return t("validation.nameRequired");
          if (value.length < 2) return t("validation.nameMinLength");
          return null;
        }}
      >
        <Field.Label className="text-sm font-medium">
          {t("name.label")}
        </Field.Label>
        <Input type="text" placeholder={t("name.placeholder")} required />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <Field.Root
        name="email"
        validate={(value) => {
          if (typeof value !== "string" || value.length === 0)
            return t("validation.emailRequired");
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return t("validation.emailInvalid");
          return null;
        }}
      >
        <Field.Label className="text-sm font-medium">
          {t("email.label")}
        </Field.Label>
        <Input type="email" placeholder={t("email.placeholder")} required />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <Field.Root
        name="password"
        validate={(value) => {
          if (typeof value !== "string" || value.length === 0)
            return t("validation.passwordRequired");
          if (value.length < 8) return t("validation.passwordMinLength");
          return null;
        }}
      >
        <Field.Label className="text-sm font-medium">
          {t("password.label")}
        </Field.Label>
        <Input
          type="password"
          placeholder={t("password.placeholder")}
          required
        />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <Field.Root
        name="password_confirmation"
        validate={(value, formValues) => {
          if (typeof value !== "string" || value.length === 0)
            return t("validation.passwordConfirmationRequired");
          if (value !== formValues.password)
            return t("validation.passwordConfirmationMismatch");
          return null;
        }}
      >
        <Field.Label className="text-sm font-medium">
          {t("passwordConfirmation.label")}
        </Field.Label>
        <Input
          type="password"
          placeholder={t("passwordConfirmation.placeholder")}
          required
        />
        <Field.Error className="text-sm text-destructive" />
      </Field.Root>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader />}
          {t("addUser")}
        </Button>
      </div>
    </Form>
  );
};

export default TeamPage;
