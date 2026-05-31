import React, { useState, useEffect } from "react";
export default function WorkerRow({ worker, onEdit, onDelete, factories, roles }) {
    const roleOrder = ["ceo", "manager", "worker"];

    const groupedFactories = worker.factories.reduce((groups, factory) => {

        if (!groups[factory.role]) {
            groups[factory.role] = [];
        }

        groups[factory.role].push(factory.name);

        return groups;

    }, {});
    return (
        <tr>

            <td>
                {worker.email}
            </td>

            <td>
                {worker.full_name}
            </td>

            <td>
                {roles[worker.role]}
            </td>
            <td>
                {roleOrder.map(role => {

                    if (!groupedFactories[role]) {
                        return null;
                    }

                    return (
                        <div key={role}>
                            {roles[role]}: {groupedFactories[role].join(", ")}
                        </div>
                    );
                })}
            </td>
            <td>
                <button className="btn btn--icon"
                    onClick={() => onEdit(worker)}
                    title="Редактировать"
                >
                    <i className="bi bi-pencil-fill"></i>
                </button>
                <button className="btn btn--icon btn--danger"
                    onClick={() => onDelete(worker)}
                    title="Заблокировать"
                >
                    <i className="bi bi-trash3"></i></button>
            </td>
        </tr >
    )
}