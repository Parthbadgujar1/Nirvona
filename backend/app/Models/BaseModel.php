<?php

namespace Nirvona\Models;

use PDO;

/**
 * BaseModel
 *
 * Base class for all models providing common attributes and methods.
 * Models represent the database entities and their attributes.
 */
abstract class BaseModel
{
    protected PDO $db;

    // Common attributes
    public ?string $id = null;
    public ?string $createdAt = null;
    public ?string $updatedAt = null;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Get model as array
     *
     * @return array
     */
    public function toArray(): array
    {
        return get_object_vars($this);
    }

    /**
     * Fill model from array
     *
     * @param array $data
     * @return static
     */
    public function fill(array $data): static
    {
        foreach ($data as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }
        return $this;
    }
}
