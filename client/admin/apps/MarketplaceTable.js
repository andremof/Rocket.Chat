import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Box, Table, TextInput, Icon, Tag } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import PriceDisplay from './PriceDisplay';
import AppAvatar from '../../components/basic/avatar/AppAvatar';
import AppStatus from './AppStatus';
import { useLoggedInCloud } from './hooks/useLoggedInCloud';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useFilteredMarketplaceApps } from './hooks/useFilteredMarketplaceApps';
import { useResizeInlineBreakpoint } from '../../hooks/useResizeInlineBreakpoint';
import { Th, GenericTable } from '../../components/GenericTable';
import AppMenu from './AppMenu';

const FilterByText = React.memo(({ setFilter, ...props }) => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [setFilter, text]);

	return <Box mb='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput placeholder={t('Search_Apps')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
});

const MarketplaceRow = ({
	handler,
	isBig,
	isLoggedIn,
	isMedium,
	setModal,
	...props
}) => {
	const {
		author: { name: authorName },
		name,
		id,
		description,
		categories,
		purchaseType,
		pricingPlans,
		price,
		iconFileData,
		marketplaceVersion,
		iconFileContent,
		installed,
	} = props;
	const t = useTranslation();
	const [showStatus, setShowStatus] = useState(false);

	const toggleShow = (state) => () => setShowStatus(state);

	const preventDefault = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	return <Table.Row
		key={id}
		data-id={id}
		data-version={marketplaceVersion}
		onKeyDown={handler}
		onClick={handler}
		tabIndex={0}
		role='link'
		action
		onMouseEnter={toggleShow(true)}
		onMouseLeave={toggleShow(false)}
	>
		<Table.Cell withTruncatedText display='flex' flexDirection='row'>
			<AppAvatar size='x40' mie='x8' alignSelf='center' iconFileContent={iconFileContent} iconFileData={iconFileData}/>
			<Box display='flex' flexDirection='column' alignSelf='flex-start'>
				<Box color='default' fontScale='p2'>{name}</Box>
				<Box color='default' fontScale='p2'>{`${ t('By') } ${ authorName }`}</Box>
			</Box>
		</Table.Cell>
		{isBig && <Table.Cell>
			<Box display='flex' flexDirection='column'>
				<Box color='default' withTruncatedText>{description}</Box>
				{categories && <Box color='hint' display='flex' flex-direction='row' withTruncatedText>
					{categories.map((current) => <Tag disabled key={current} mie='x4'>{current}</Tag>)}
				</Box>}
			</Box>
		</Table.Cell>}
		{isMedium && <Table.Cell >
			<PriceDisplay {...{ purchaseType, pricingPlans, price }} />
		</Table.Cell>}
		<Table.Cell withTruncatedText>
			<Box display='flex' flexDirection='row' alignItems='center' onClick={preventDefault}>
				<AppStatus app={props} setModal={setModal} isLoggedIn={isLoggedIn} showStatus={showStatus} mie='x4'/>
				{installed && <AppMenu display={showStatus ? 'block' : 'none'} app={props} setModal={setModal} isLoggedIn={isLoggedIn} mis='x4'/>}
			</Box>
		</Table.Cell>
	</Table.Row>;
};

export function MarketplaceTable({ setModal }) {
	const t = useTranslation();
	const [ref, isBig, isMedium] = useResizeInlineBreakpoint([800, 600], 200);

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedText = useDebouncedValue(params.text, 500);
	const debouncedSort = useDebouncedValue(sort, 200);

	const [data, total] = useFilteredMarketplaceApps({ sort: debouncedSort, text: debouncedText, ...params });

	const isLoggedIn = useLoggedInCloud();

	const router = useRoute('admin-apps');

	const handler = useCallback((e) => {
		if (e.type !== 'click' && !['Enter', ' '].includes(e.key)) {
			return;
		}

		const { id, version } = e.currentTarget.dataset;

		router.push({
			context: 'details',
			version,
			id,
		});
	}, [router]);

	const onHeaderClick = useCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w={isMedium ? 'x240' : 'x180'}>{t('Name')}</Th>,
		isBig && <Th key={'details'}>{t('Details')}</Th>,
		isMedium && <Th key={'price'}>{t('Price')}</Th>,
		<Th key={'status'} w='x160'>{t('Status')}</Th>,
	].filter(Boolean), [sort, onHeaderClick, isMedium, t, isBig]);

	const renderRow = useCallback((props) => <MarketplaceRow
		handler={handler}
		isBig={isBig}
		isLoggedIn={isLoggedIn}
		isMedium={isMedium}
		setModal={setModal}
		{...props}
	/>, [handler, isBig, isLoggedIn, isMedium, setModal]);

	return <GenericTable
		ref={ref}
		FilterComponent={FilterByText}
		header={header}
		renderRow={renderRow}
		results={data}
		total={total}
		setParams={setParams}
		params={params}
	/>;
}

export default MarketplaceTable;
