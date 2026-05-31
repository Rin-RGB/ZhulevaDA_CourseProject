import { Link } from "react-router-dom";

export default function Header() {
    return (
        <header>
            <nav>
                <Link to="/">
                    Каталог
                </Link>

                {" | "}

                <Link to="/factories">
                    Заводы
                </Link>

                {" | "}

                <Link to="/employees">
                    Сотрудники
                </Link>

                {" | "}

                <Link to="/supplies">
                    Поставки
                </Link>

                {" | "}

                <Link to="/login">
                    Войти
                </Link>
            </nav>
        </header>
    );
}