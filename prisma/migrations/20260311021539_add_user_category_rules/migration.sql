-- CreateTable
CREATE TABLE "user_category_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_category_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "user_category_rules_user_id_idx" ON "user_category_rules"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_category_rules_user_id_keyword_key" ON "user_category_rules"("user_id", "keyword");
