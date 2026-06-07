import React, { useState, useEffect } from "react";
export default function ProductRow({
    sort,
    product,
    onRead,
    CEOAccess,
    onEdit,
    onDelete
}) {
    return (
        <tr onClick={() => onRead(product)}>

            <td>
                {product.name}
            </td>

            <td>
                {product.weight}
            </td>

            <td>
                {product.price}
            </td>

            <td>
                {product.expiration_days}
            </td>

            <td>
                {sort === "profit" ? product.profit : product.ingredients_count}
            </td>
            {
                CEOAccess &&
                <>
                    <td onClick={(e) => {
                        e.stopPropagation();
                    }}>
                        <button className="btn btn--icon"
                            onClick={() => onEdit(product)}
                            title="Редактировать"
                        >
                            <i className="bi bi-pencil-fill"></i>
                        </button>
                        <button className="btn btn--icon btn--danger"
                            onClick={() => onDelete(product.id)}
                            title="Удалить"
                        >
                            <i className="bi bi-trash3"></i>
                        </button>
                    </td>
                </>
            }

        </tr>
    )
}