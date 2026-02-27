import React from 'react';
import './InfoBanner.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export type BannerType = 'default' | 'success' | 'warning' | 'error';

export interface InfoBannerProps {
    message: string;
    title?: string
    iconClass: string;
    type?: BannerType;
    className?: string;
}

const InfoBanner: React.FC<InfoBannerProps> = ({
    message,
    title,
    iconClass,
    type = 'default',
    className = ''
}) => {
    return (
        <div className={`banner ${type} ${className}`}>
            <div className='iconWrapper'>
                <i className={iconClass}></i>
            </div>
            <div className='message-container'>
                {title && <p className='message-container__title'>{title}</p>}
                <p>{message}</p>
            </div>
        </div>
    );
};

export default InfoBanner;

