import React from 'react'
import PropTypes from "prop-types";
import classNames from 'classnames';
import css from "./Modal.scss";

Modal.propTypes = {
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func.isRequired,
    show: PropTypes.bool.isRequired,
    modalTitle: PropTypes.content.isRequired
};
export default function Modal({
    children,
    onClose,
    show,
    modalTitle
}) {
    const modalClassNames = classNames(css.modal)
    if (!show) {
    return null;
    }
    return show && (
        <div className={css.modal} id="modal">
            <div className={css.modal__content}>
                <h4>{modalTitle}</h4>
                <div className={css.content}><p>{children}</p></div>
                <div className={css.actions}>
                <button className="toggle-button" onClick={onClose}>
                    OK
                </button>
                </div>
            </div>
        </div>
    );
}