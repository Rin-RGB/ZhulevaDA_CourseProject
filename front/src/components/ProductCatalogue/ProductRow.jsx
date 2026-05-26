import React, { useState, useEffect } from "react";
export default function ProductRow({ sort, product, onRead }) {
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

        </tr>
    )
}