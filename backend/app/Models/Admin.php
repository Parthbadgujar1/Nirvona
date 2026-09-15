<?php

namespace Nirvona\Models;

/**
 * Admin Model
 *
 * Represents an admin user. Mirrors the frontend's `Admin` type. Holds
 * a `passwordHash`, never the plaintext password; never expose this
 * field back to a client - use toPublicArray().
 */
class Admin extends BaseModel
{
    public ?string $name = null;
    public ?string $email = null;
    public ?string $passwordHash = null;
    public ?string $avatarUrl = null;
    public ?string $status = 'active';

    /**
     * Array representation with the password hash stripped
     *
     * @return array
     */
    public function toPublicArray(): array
    {
        $data = $this->toArray();
        unset($data['passwordHash']);
        return $data;
    }
}
