import React, { type ReactNode } from 'react';
import { Button, Tooltip } from 'antd';
import { Link } from 'react-router-dom';

type IconActionButtonProps = {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  type?: 'default' | 'primary' | 'text' | 'link';
};

function IconActionButtonComponent({
  label,
  icon,
  href,
  onClick,
  danger = false,
  disabled = false,
  loading = false,
  type = 'default'
}: IconActionButtonProps) {
  const button = (
    <Button
      size="small"
      shape="circle"
      icon={icon}
      danger={danger}
      disabled={disabled}
      loading={loading}
      type={type}
      aria-label={label}
      title={label}
      onClick={href ? undefined : onClick}
    />
  );

  if (href && !disabled) {
    return (
      <Tooltip title={label}>
        <span style={{ display: 'inline-flex' }}>
          <Link to={href} aria-label={label} title={label}>
            {button}
          </Link>
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={label}>
      <span style={{ display: 'inline-flex' }}>{button}</span>
    </Tooltip>
  );
}

export const IconActionButton = React.memo(IconActionButtonComponent);
