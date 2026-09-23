<?php

namespace Nirvona\Repositories;

/**
 * SiteSettingsRepository
 *
 * Key/value store for admin-editable organisation details. Not id-based, so
 * it does not use BaseRepository's id/createdAt helpers.
 */
class SiteSettingsRepository extends BaseRepository
{
    protected string $table = 'site_settings';

    /**
     * @return array<string, string>
     */
    public function allSettings(): array
    {
        $rows = $this->db->query("SELECT key, value FROM {$this->table}")->fetchAll(\PDO::FETCH_KEY_PAIR);
        return $rows ?: [];
    }

    /**
     * @param array<string, string> $values
     */
    public function setMany(array $values): void
    {
        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} (key, value, updatedAt) VALUES (?, ?, NOW())
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updatedAt = NOW()"
        );
        $this->db->beginTransaction();
        try {
            foreach ($values as $key => $value) {
                $stmt->execute([$key, $value]);
            }
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
