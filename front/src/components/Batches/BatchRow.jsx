import React, { useState, useEffect } from "react";
export default function BatchRow({ mode, batch, onDelete }) {
    return (
        <>
            <tr>
                <td> {mode === "products"
                    ? batch.product_name
                    : batch.ingredient_name}
                </td>
                <td> {batch.factory_name} </td>
                <td> {mode === "products"
                    ? batch.amount
                    : batch.delivery_kg}
                </td>
                <td> {mode === "products"
                    ? batch.production_date
                    : batch.delivery_date}
                </td>
                <td> {batch.expiry_date} </td>
                <td>
                    {batch.is_fresh ? 'Да' : 'Нет'}
                </td>
                <td>
                    <button
                        className="btn btn--danger"
                        onClick={onDelete}>
                        <i className="bi bi-trash3"></i>
                    </button>
                </td>
            </tr>

        </>
    )
}