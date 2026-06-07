import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function FactoryRow({ factory, sort, onDelete, CEOAccess, managerAccess, myFactories }) {
    const navigate = useNavigate();
    const [ceos, setCeos] = useState([]);
    const [managers, setManagers] = useState([]);
    useEffect(() => {

        if (!factory?.managers) return;
        setCeos(factory.managers.
            filter(u => u.role === 'ceo').
            map(m => `${m.name} ${m.last_name}`));
        setManagers(factory.managers.
            filter(u => u.role === 'manager').
            map(m => `${m.name} ${m.last_name}`));
    }, [factory])

    return (
        <tr>

            <td className="span--title">
                {factory.name}
            </td>

            <td>
                {factory.address}
            </td>

            <td>
                <p><span className="span--title">CEO:</span> {ceos.join(', ')}</p>
                {managers.length > 0 &&
                    <p><span className="span--title">Руководители завода:</span> {managers.join(', ')}</p>
                }
            </td>


            <td onClick={() => {
                if (myFactories.some(f => f.id === factory.id)) {
                    navigate(`/factory/${factory.id}`);
                } else {
                    return;
                }
            }}>
                {myFactories.some(f => f.id === factory.id) &&
                    <span className="td--link">Перейти на страницу завода ↳</span>
                }
            </td>

            <td>
                {sort === "total_value" ? factory.total_value : factory.volume}
            </td>
            {CEOAccess && <td onClick={onDelete}>
                <button className="btn btn--icon btn--danger">
                    <i className="bi bi-trash3"></i>
                </button>
            </td>}

        </tr>
    )
}