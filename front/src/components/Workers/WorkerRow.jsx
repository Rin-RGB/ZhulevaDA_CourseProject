import React, { useState, useEffect } from "react";
export default function WorkerRow({
    worker,
    onEdit,
    onDelete,
    factories,
    roles,
    availibleRoles,
    CEOAccess
}) {
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
                            <span className="span--title">{roles[role]}:</span> {groupedFactories[role].join(", ")}
                        </div>
                    );
                })}
            </td>
            <td>
                {
                    availibleRoles.includes(worker.role) &&
                    <>
                        <button className="btn btn--icon"
                            onClick={() => onEdit(worker)}
                            title="Редактировать"
                        >
                            <i className="bi bi-pencil-fill"></i>
                        </button>

                    </>
                }
                {
                    CEOAccess &&
                    <>
                        <button className="btn btn--icon btn--danger"
                            onClick={() => onDelete(worker)}
                            title="Заблокировать"
                        >
                            <i className="bi bi-trash3"></i></button>
                    </>
                }
            </td>
        </tr >
    )
}