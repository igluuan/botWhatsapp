CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "phone_number" TEXT NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

CREATE TABLE "categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

CREATE TABLE "transactions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "category" TEXT NOT NULL,
  "category_id" TEXT,
  "payment_method" TEXT NOT NULL,
  "description" TEXT,
  "transaction_date" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");
CREATE INDEX "transactions_category_id_idx" ON "transactions"("category_id");

CREATE TABLE "message_logs" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3),
  CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "message_logs_user_id_idx" ON "message_logs"("user_id");

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "message_logs"
ADD CONSTRAINT "message_logs_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
