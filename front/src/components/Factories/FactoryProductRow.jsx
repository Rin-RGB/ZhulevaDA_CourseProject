import React, { useState, useEffect } from "react";
export default function FactoryProductRow({ sort, product, onDelete, onClick, disabledFields = false, selected = false }) {
    return (
        <tr onClick={onClick} className={selected ? "selected" : ""}>
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
                {product.profit}
            </td>


            {
                !disabledFields &&
                <td onClick={onDelete}>
                    <i className="bi bi-trash3"></i>
                </td>
            }
            <style>
                {`
                    .selected {
                        background-color: #d3d3d3;
                    }
                `}
            </style>
        </tr>
    )
}

