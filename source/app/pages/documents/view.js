
/**********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import React, { Fragment, useCallback, useEffect, useRef, useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reject, either, isNil, isEmpty, groupWith } from 'ramda'
import queryString from 'query-string'
import cs from 'classnames'
import { Storage } from 'aws-amplify'

import Loading from '../../components/Loading/Loading'
import DocumentViewer from '../../components/DocumentViewer/DocumentViewer'
import DocumentSearchBar from '../../components/DocumentSearchBar/DocumentSearchBar'
import Tabs from '../../components/Tabs/Tabs'

import {
  fetchDocument,
  addRedactions,
  clearRedactions,
  addHighlights,
  clearHighlights

} from '../../store/entities/documents/actions'
import { getDocumentById } from '../../store/entities/documents/selectors'
import { setHeaderProps , setSelectedTrack} from '../../store/ui/actions'
import { getSelectedTrackId } from '../../store/ui/selectors'
import { setCurrentPageNumber, setDocumentSearchQuery } from '../../store/entities/meta/actions'
import { getDocumentSearchQuery, getCurrentPageNumber } from '../../store/entities/meta/selectors'

import {
  getDocumentPageCount,
  getPageLines,
  getDocumentLines,
  getDocumentEntityPairs,
  getDocumentKeyValuePairs,
  getDocumentBarcodes,
  getPageTables,
  getPageWordsBySearch,
  getDocumentTables,
} from '../../utils/document'

import {
  COMPREHEND_MEDICAL_SERVICE,
  COMPREHEND_SERVICE
} from '../../utils/dus-constants'



import css from './view.scss'
import Button from '../../components/Button/Button'
import KeyValueList from '../../components/KeyValueList/KeyValueList'
import RawTextLines from '../../components/RawTextLines/RawTextLines'
import EntitiesCheckbox from '../../components/EntitiesCheckbox/EntitiesCheckbox'
import DocumentPreview from '../../components/DocumentPreview/DocumentPreview'
import TableResults from '../../components/TableResults/TableResults'
import BarcodeResults from '../../components/BarcodeResults/BarcodeResults'

Document.propTypes = {
  currentPageNumber: PropTypes.number,
  dispatch: PropTypes.func,
  document: PropTypes.object,
  id: PropTypes.string,
  pageTitle: PropTypes.string,
  searchQuery: PropTypes.string,
  track: PropTypes.string,
}

Document.defaultProps = {
  document: {},
}


Document.getInitialProps = function({ query, store }) {
  const state = store.getState()
  const { id } = query || {}
  const { documentName } = getDocumentById(state, id) || {}

  const props = {
    showNavigation: false,
    backButton: true
  }

  return props
}

function Document({ currentPageNumber, dispatch, id, document, pageTitle, searchQuery, track }) {
  // TODO: Ensure id corresponds to a valid resource, otherwise 404
  // e.g. /documents/export and /documents/view should fail
  const isDocumentFetched = !!document.textractResponse && !!document.comprehendMedicalResponse && !!document.comprehendResponse
  const { status } = useFetchDocument(dispatch, id, isDocumentFetched)
  const pageCount = getDocumentPageCount(document)
  const { documentName, documentURL, searchablePdfURL } = document


  // Reset currentPageNumber on mount
  useEffect(() => {
    dispatch(setCurrentPageNumber(1))
  }, [dispatch])

  useEffect(() => {
    return () => {
      dispatch(clearRedactions(id))
    }
  }, [dispatch, id])


  // Set search results data
  const wordsMatchingSearch = useMemo(() => {
    return getPageWordsBySearch(document, currentPageNumber, searchQuery)
  }, [document, currentPageNumber, searchQuery])

  const docData = useMemo(() => {
    const pairs = getDocumentKeyValuePairs(document)
    const tables = getDocumentTables(document)
    const lines = getDocumentLines(document)
    const entities = getDocumentEntityPairs(document, COMPREHEND_SERVICE)
    const medicalEntities = getDocumentEntityPairs(document, COMPREHEND_MEDICAL_SERVICE)
    const barcodes = getDocumentBarcodes(document)
    return { pairs, tables, lines, entities , medicalEntities, barcodes }
    // eslint-disable-next-line

  }, [document, document.textractResponse ,document.medicalComprehendResponse, document.comprehendResponse])


  // Set the paged content for each tab
  const pageData = useMemo(() => {
    const lines = getPageLines(document, currentPageNumber)
    const pairs = docData.pairs.filter(d => d.pageNumber === currentPageNumber)
    const tables = docData.tables.filter(d => d.pageNumber === currentPageNumber)
    const entities = docData.entities.filter(d => d.pageNumber === currentPageNumber)
    const medicalEntities = docData.medicalEntities.filter(d => d.pageNumber === currentPageNumber)
    const barcodes = docData.barcodes
    return { lines, pairs, tables , entities , medicalEntities, barcodes }
    // eslint-disable-next-line
  }, [document, document.textractResponse,document.comprehendMedicalResponse, currentPageNumber, docData.pairs, docData.entities , docData.medicalEntities , docData.tables])

  const [tab, selectTab] = useState('search')

  const [trackTab, selectTrack] = useState('search')

  const downloadKV = useCallback(async () => {
    const { resultDirectory } = document
    const url = await Storage.get(`${resultDirectory}/textract/page-${currentPageNumber}-forms.csv`, {
      expires: 300,
    })
    window.open(url)
  }, [currentPageNumber, document])

  const downloadEntities = useCallback(async () => {
    const { resultDirectory } = document
    const url = await Storage.get(`${resultDirectory}/comprehend/comprehendEntities.json`, {
      expires: 300,
    })
    window.open(url)
  }, [ document])

  const downloadMedicalEntities = useCallback(async () => {
    const { resultDirectory } = document
    const url = await Storage.get(`${resultDirectory}/comprehend/comprehendMedicalEntities.json`, {
      expires: 300,
    })
    window.open(url)
  }, [ document])

  const downloadMedicalICD10Ontologies = useCallback(async () => {
    const { resultDirectory } = document
    const url = await Storage.get(`${resultDirectory}/comprehend/comprehendMedicalICD10.json`, {
      expires: 300,
    })
    window.open(url)
  }, [ document])

  const redactMatches = useCallback(async () => {
    dispatch(addRedactions(id, currentPageNumber, wordsMatchingSearch))
    dispatch(setDocumentSearchQuery(''))
  }, [currentPageNumber, dispatch, id, wordsMatchingSearch])

  const redact = useCallback(
    async (bbox, pageNumber = currentPageNumber) => {
      dispatch(addRedactions(id, pageNumber, [bbox]))
    },
    [currentPageNumber, dispatch, id]
  )

  const highlightEntities = useCallback(
    async (bbox, pageNumber = currentPageNumber) => {
      dispatch(addHighlights(id, pageNumber, bbox))
    },
    [currentPageNumber, dispatch, id]
  )



  const clearReds = useCallback(() => {
    dispatch(clearRedactions(id))
  }, [dispatch, id])

  const redactAllValues = useCallback(
    async (bbox, pageNumber = currentPageNumber) => {
       dispatch(addRedactions(id, currentPageNumber, pageData.pairs.map(p => p.valueBoundingBox)))
  }, [currentPageNumber, dispatch, id, pageData.pairs])


  const redactEntityMatches = useCallback(async (pageNumber ,bboxlist) => {
    dispatch(addRedactions(id, pageNumber,bboxlist.map(p => p)))
  }, [currentPageNumber, dispatch, id])

  const contentRef = useRef()

  const downloadRedacted = useCallback(async () => {
    const theThing = contentRef.current.querySelector('canvas,img')

    const cnv = window.document.createElement('canvas')
    // TODO the resolution is just based on the viewport for pdfs. It shouldn't be.
    cnv.width = theThing.naturalWidth || theThing.width
    cnv.height = theThing.naturalHeight || theThing.height

    const ctx = cnv.getContext('2d')

    ctx.drawImage(theThing, 0, 0)

    ctx.fillStyle = '#000'
    const x = val => val * cnv.width
    const y = val => val * cnv.height
    const margin = 2

    Object.values(document.redactions[currentPageNumber]).forEach(red => {
      ctx.fillRect(
        x(red.Left) - margin,
        y(red.Top) - margin,
        x(red.Width) + 2 * margin,
        y(red.Height) + 2 * margin
      )
    })

    cnv.toBlob(blob => {
      const a = window.document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.target = '_blank'
      a.style.display = 'none'
      a.download = document.objectName
        .split('/')
        .pop()
        .replace(/\.[^.]+$/, '-REDACTED.png')
      window.document.body.appendChild(a)
      a.click()
    }, 'image/png')
  }, [currentPageNumber, document.objectName, document.redactions])

  const pagePairsAsMarks = useMemo(() => {
    return pageData.pairs.reduce((acc, { id, keyBoundingBox, valueBoundingBox }) => {
      return [
        ...acc,
        { ...keyBoundingBox, id, type: 'key' },
        { ...valueBoundingBox, id, type: 'value' },
      ]
    }, [])
  }, [pageData.pairs])

  const pageLinesAsMarks = useMemo(() => {
    return pageData.lines.map(({ id, boundingBox }) => {
      return {
        id,
        ...boundingBox,
      }
    })
  }, [pageData.lines])

  const [highlightedKv, setHighlightedKv] = useState(null)

  useEffect(() => {
    if (highlightedKv) {
      setTimeout(() => {
        setHighlightedKv(null)
      }, 10)
    }
  }, [highlightedKv])



  const switchPage = useCallback(
    pageNumber => {
      dispatch(setCurrentPageNumber(pageNumber))
    },
    [dispatch]
  )

  const setHighlightedLine = useCallback(() => {}, [])

  const barcodesData = {"BarcodesRaw": [{"page": 0, "num_candidate": 2, "raw": "xí\u001bÛrÛ6ö¹ù\nvgW\u0012I]íqÔqä¸q7¾lì6;}IÈDC\u0001\u001a\u0000´lý\u0004H @JId¦ñp®887àÐÇ??®Þ\u0003¤\f\u0011üúÀ\u001fx\u0007=C\u0012!|ÿúà·Û³þüàçÅ«cÆ>\u001d­!cà\u001eöÖ\b\u0013ú{A2:è\t\u0016\u001dÁ0öf¯\u000fbÎ7GÃáv»\u001dA\u0018\u000fsð\u0010.ßõ=ÏõWÃ©N2ï$\u000b\u0012]ïuø!Å÷;I|A2×HÆã.ñXui'ÉÔ 9ì´Øá¬Ú¼8\u000etß?¬Ðã\u001aö³ü\u001c÷9x`\u0000\n¸8È>âCÁnÔ÷*Ã=2Tc°\u001d\r\b½\u001f\u0006ÂZÃÿ]¼¿\tc¸\u0006}\u0019\u00078\u0007W?å~\u0012C\u0010A*~É!Àà·\u001câÌc²õcV_\u0000\u0014E\u0010\u0002\u000eäZ¾È`²z»Þ$äi\r1¿ö\u0017+0x<´**LnL §©$³Àâ\u0002·¸ M\\Ð\"N'¤0\u000fÂNKB6P\u001e&Ñ\u0006Ö\u001aZÌñ\u0003\r%\u000f ù\u0000C6\\DR\u001cÁè\u0016<»\u0004P_C\u0005Ö\u000b$\u0002cá{ãç\u001d\u000fÍu\u001d\u0005Å)\u0016èÞ¤@×ða»tM¹\u000f\u000bj\u000e©È4\"\u000f}'%Û´hZò¿)HÐ\nÁè\u001c?@Æ³\u0013f\u000bÏ²i+¢ë\tc[ÙHHé,ôVÊ¬G\u0004Ii\bo\u0018k=PäÂ5E\u000fqOh'ÄÄS%f\u0011x×÷\u0007þ| µ*Ö+Låãø^ÉúpD¶¬çK\u0002\u0013\\\u0011FB¿ß÷Æ}cçkÕîÈ\tIfçð\u001e1Ý¤ÅòíÓ\u0006.<_òÓ×¨§0AbGO\u0017Ç$2\f¨TX=3È{\u0012c²-Dì\u001fð=q*½\u0013z\u0007\u0011¿w\u001a|+²j¯Í]í¼×àûí\u0015ö.Åþ0¤[Hï>{Ê«Îþ#ým\u001e\u000f½>æÁ\\w:\u0001.)Â\u0004eI\u00190¶%4º¦ÃÐHÃNWe*¶4-_-þx§§©¼B\u000e\u001d%2'ã\u0014`\u0006r!§sOûÞá­ï\u001d³¿ÁxêýË\u000b", "format": "PDF_417", "type": "TEXT", "points": [[0.05639250814332247, 0.7173725151253241], [0.6105456026058632, 0.7173725151253241], [0.6105456026058632, 0.8426966292134831], [0.05639250814332247, 0.8426966292134831]]}, {"page": 0, "num_candidate": 3, "raw": "f¬Àã5¤H\u001cEf\u0011[®\u0015Xüç\u0019%ki8Oó%²\u0006ªcß\u0012\u0015ÔATÃ\u0015WûÏ~Ê¨\\(­Ô¯:P?üZ®±£¼R-[\u0011©\u0005ÁÂÂ¼d½\u0006\b\u0011º®ÎI(ÎrÃk@¹ðBÕ\u0013H \\ºÎqÎEÍå\"Z9hd%V\u0011H.(\u0017\u0017)ËR-ÀX*T\u0003jD+D\u0019\u0014Å®ª%\rï\u0001/féøp<\u0011Mîl\u001eHÔº\u0002<®´,Ë`ÞÒª\rGKaÀ{B\u0016\u0017¿\r\u0002°AÑñÐag°ðÑx25©Ê:êPDùG%ó}(¢âÊqWâjfÎ{í£\r\u0011gr\"±t5El8iK\fÆ)\u0014O\u001eø!Â\u001aæ»©`\u0006ELR\u0006/ÓµH¿¬¼4W\r\u0002N¶ÂçSÂ¸ÀÎLM¶±?ÐfI\"¸{YÀY\u0000Åþ\u001d\u001b'bµ4¾R\u0004Eì\u00032­/ÊïPuè\"ºË(;·\\èiÑ}&{æ«¤Q®è\u0011'[e\u0016U*¶@*\u0012Ó.R,bl#Ú,þ¤éïÍÖ\u001aDxd -Ý\u00048òp<\u0012ô`\u001bm\u0015®emhS¦H[¦±g¡@·IKú±hI@+\nÒ\"Tm)HBªs\u000bÄÑÂÈDú\u0006ÁûõÏ×a·@«²1J\"í\"ôÙæùz\u000fs¡µÃV\u0005nÖ^­Þ Êc#¡>A@/DaOÁ(¤þ¤(º\u0016°\u001eá\u0016;\u001dí:®Z Â|ç8Oj&êD¢,ùB\u000ePR%4°N¹¸á,3^Kn\u0012X] 2©µsð\u000eõÚ\u001bVKÆâzw7oTÜ ug4 ZJÐà§«ªÎéd\u0016håÇu_ýºî»o´_\u0012|5ÿåþ\u001b¼øïßÎ)|8\u001a¿vÁèB4Ú\u001fth­¡>Y\u0014s1\u001d\u0005\u0013¯Ö \u0016\u0010\u0017M°\u0005¾&ÐmæT£¦ä\rDÂ°[Ñçí«çtb%±ªiU¤Ã÷í­.oÙ¾ôÎòÅSâÝÁ{TÞ3Ë»_\r £C\u001cUÈêò§-×QEC½¡âZÒ\"G!Qe", "format": "PDF_417", "type": "TEXT", "points": [[0.05639250814332247, 0.9011812157879574], [0.6105456026058632, 0.9011812157879574], [0.6105456026058632, 1.0265053298761164], [0.05639250814332247, 1.0265053298761164]]}, {"page": 0, "num_candidate": 4, "raw": "\u0015\u0006Ô©\nR~¡­èa·ÃîÚ\u0010|g#ôÝÌ \\}o3\u000463\u0018>öý!Ò®ê·qi\u0013ù c>ó\u0018fÁ×aíu[â[9Ý\u0012ov²Ì)eOXÆ\u000b\u0017Õf,n\u001d\u0018\u0005;0êÒ¨ØGV\u001aÞ\f;´Óð´bîÈ·_ZÃ\u0019\fSqeFYª>ÜpÎ;ÌqcÒ¡\u001eÎìâäEdÏ\u0007yêÐÅ\u001fO\u000fÝ\u0003ÆüEÃ¶kå\\Ü\"µl!Q\u001a\u001a=âäîíãFX\u0017²ú;^Sù¿»ê\u0015®]q§XRS©Ét²³R%î®Jé¯\t\b³fÓÛ\u0013\u001ccQ`5\u00160åÏ½ÝM5NZMå«õdÙ\u000bÀ\u001bÂc¥·ÓZûxßhÜ~-Í°8­{^S±`¼Ç9¼ßzNÉ\u0012\\\u0003½!_$L\u0013ó\u001eõÃÅ÷\u000fk_É\nC^\u001f\u00017Ì\u0014\u0004£ÑÎêøþÔ·êc\bTOâfctù­q\bV\u0013ì¡´Ù;\u0001ÍïÈNÝöI$þÈk÷¦vé6\u0005-éDc\u001dL÷×!Î\u0010\u000b³Qz{xyã}Êó&íGÕ._%\u0006&Ù\fý»(Ø\"½VãÍ¼%#@û^ÁºÛü\u0006VS._ÿ\u001d$i9cÔÚL§3³YîK¹Y©+w*7Î9\bc\u0018e\u0003K]£bý:\u0014f>­>èRÏV­(M.Ù\u0018ýj¥tir¨Ô\u001fÁ=Ì=0«\u0016ò:¼I¿$IºÆ#P{2aM²¢¿±H,A\u0015UBä\u000bÝºÉ\u0001Ý¿{ÞáÀ\u000e²\u0011»daâi'Ó8\nÉ\u00180n5ð\u0017Ì*VÎÅ­\u001abK5ò3º)[{MÁ/ÙyÍïM!¾ájMK\u001ee¿PÂ,·]î8»]q´nÈÊ9l\u0011cd_ºj\\ÕÒÌ6«m}Å»Z´\\\u0004¢ü\u000eÎ.\b'ô\u0001Æ(L,©×þx\rè\u0015ÍéîÐ§æc_Øl\u0010>­v±ÕWõg\u000e]÷Ù¶\u000b­jòÉøÕê#¡\"ðÄDÓ¦,Ýh¹Ñi¢\u0017\u0003þE\u0006|2«ï(¾®è:ó\u001fE\u0005ä Í>$L", "format": "PDF_417", "type": "TEXT", "points": [[0.05639250814332247, 1.0849899164505905], [0.6105456026058632, 1.0849899164505905], [0.6105456026058632, 1.2103140305387496], [0.05639250814332247, 1.2103140305387496]]}, {"page": 1, "num_candidate": 1, "raw": "ï\u0018Ð3tw¬Ó=\u001aÖþÑ%Uµ\u0017Y:\u0017Ð_ÉÝ0~&Ú\u001fZ½\u00196o@{tÒAG#Ý.[rKi6\fz+zß¼@t©7Ùãm¥]¹vÉ²ËW\u000fu]JùûÜ>º.\u001fVfcú«Q\"þâg¨6Ér6\u0010ÊÈ)¾\u000f\u0012e\nDP\u0000ø³\u001aS5qªªê(oöÒ\u0017´GýKæ~)}/¥ï¥ôí]úüÝßþ*Ü¿yékùG\u0019ÛÃÛ·)}_qØñ9¥ï\rqLVå'ÀûW¿ º&\u001a·ÁúåZø\u0019Jõ'òÑþÜ2\u000f¹\u0000¢Zè\u0006ÍgÙ°Zà\u0018Æ\u0018.%ê*¯¬µàtgæ¼Àágr¸ÊÇNÛ4w¨æ{ãusN±4oëÖA½\u000bb\r×¡[ËÃøªYÄIÿÿ;ñ\u000eÇ¥Æ`\u0007BÉ¥wZi\u0006 \bPd5&Óâp:õµ}`óêK|cÐ¨\u00052qñß ê\u001dMþwóâÿ#\u0007Êò", "format": "PDF_417", "type": "TEXT", "points": [[0.05639250814332247, 0.20512820512820512], [0.6105456026058632, 0.20512820512820512], [0.6105456026058632, 0.2693748199366177], [0.05639250814332247, 0.2693748199366177]]}, {"page": 1, "num_candidate": 3, "raw": "0906202602761", "format": "CODE_128", "type": "TEXT", "points": [[0.04336319218241042, 1.2794583693460098], [0.1675488599348534, 1.2794583693460098], [0.1675488599348534, 1.3215211754537597], [0.04336319218241042, 1.3215211754537597]]}], "BarcodesCombined": [{"content": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ssk:message minorVersion=\"3\" xmlns:ech07=\"http://www.ech.ch/xmlns/eCH-0007-f/6\" xmlns:ech08=\"http://www.ech.ch/xmlns/eCH-0008-f/3\" xmlns:ech10=\"http://www.ech.ch/xmlns/eCH-0010-f/6\" xmlns:ech11=\"http://www.ech.ch/xmlns/eCH-0011-f/8\" xmlns:ech44=\"http://www.ech.ch/xmlns/eCH-0044-f/4\" xmlns:ech46=\"http://www.ech.ch/xmlns/eCH-0046-f/4\" xmlns:ech97=\"http://www.ech.ch/xmlns/eCH-0097/3\" xmlns:ssk=\"http://www.ech.ch/xmlns/eCH-0119/3\" xmlns:zh=\"http://www.zh.ch/xmlns/zh-taxdeclaration-it/ech3-0/6\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n\t<ssk:header>\n\t\t<ssk:cantonExtension>\n\t\t\t<zh:headerExtension>\n\t\t\t\t<zh:hiddenData>\n\t\t\t\t\t<zh:selfEmploymentP1>false</zh:selfEmploymentP1>\n\t\t\t\t\t<zh:noSelfEmploymentP1>true</zh:noSelfEmploymentP1>\n\t\t\t\t\t<zh:selfEmploymentP2>false</zh:selfEmploymentP2>\n\t\t\t\t\t<zh:noSelfEmploymentP2>true</zh:noSelfEmploymentP2>\n\t\t\t\t\t<zh:relevantCooperation>false</zh:relevantCooperation>\n\t\t\t\t</zh:hiddenData>\n\t\t\t\t<zh:approvalReceipt>\n\t\t\t\t\t<zh:roundedTaxableIncome>\n\t\t\t\t\t\t<ssk:cantonalTax>104300</ssk:cantonalTax>\n\t\t\t\t\t\t<ssk:federalTax>100500</ssk:federalTax>\n\t\t\t\t\t</zh:roundedTaxableIncome>\n\t\t\t\t\t<zh:roundedRatedeterminingIncome>\n\t\t\t\t\t\t<ssk:cantonalTax>104300</ssk:cantonalTax>\n\t\t\t\t\t\t<ssk:federalTax>100500</ssk:federalTax>\n\t\t\t\t\t</zh:roundedRatedeterminingIncome>\n\t\t\t\t\t<zh:roundedTaxableQualifiedInvestments>0</zh:roundedTaxableQualifiedInvestments>\n\t\t\t\t\t<zh:roundedTaxableAsset>0</zh:roundedTaxableAsset>\n\t\t\t\t\t<zh:roundedRatedeterminingAsset>0</zh:roundedRatedeterminingAsset>\n\t\t\t\t</zh:approvalReceipt>\n\t\t\t\t<zh:sourceSystem>\n\t\t\t\t\t<zh:system>Private Tax</zh:system>\n\t\t\t\t\t<zh:version>2020-1.18.0</zh:version>\n\t\t\t\t\t<zh:operatingSystem>Windows 10</zh:operatingSystem>\n\t\t\t\t\t<zh:date>2021-04-15</zh:date>\n\t\t\t\t</zh:sourceSystem>\n\t\t\t\t<zh:documentList>\n\t\t\t\t\t<zh:documentType>01</zh:documentType>\n\t\t\t\t\t<zh:documentDeliveryMethod>01</zh:documentDeliveryMethod>\n\t\t\t\t\t<zh:documentDescription>Lohnausweis(e) pro Arbeitgeber</zh:documentDescription>\n\t\t\t\t</zh:documentList>\n\t\t\t\t<zh:documentList>\n\t\t\t\t\t<zh:documentType>02</zh:documentType>\n\t\t\t\t\t<zh:documentDeliveryMethod>01</zh:documentDeliveryMethod>\n\t\t\t\t\t<zh:documentDescription>Lohnausweise Nebenerwerb</zh:documentDescription>\n\t\t\t\t</zh:documentList>\n\t\t\t\t<zh:versionFK>2020-8c490-ad828</zh:versionFK>\n\t\t\t\t<zh:clientPasswordProtection>false</zh:clientPasswordProtection>\n\t\t\t</zh:headerExtension>\n\t\t\t<ssk:canton>ZH</ssk:canton>\n\t\t</ssk:cantonExtension>\n\t\t<ssk:transactionDate>2021-06-09T10:40:40.460+02:00</ssk:transactionDate>\n\t\t<ssk:taxPeriod>2020</ssk:taxPeriod>\n\t\t<ssk:periodFrom>2020-01-01</ssk:periodFrom>\n\t\t<ssk:periodTo>2020-12-31</ssk:periodTo>\n\t\t<ssk:canton>ZH</ssk:canton>\n\t\t<ssk:source>0</ssk:source>\n\t\t<ssk:sourceDescription>Private Tax</ssk:sourceDescription>\n\t</ssk:header>\n\t<ssk:content>\n\t\t<ssk:mainForm>\n\t\t\t<ssk:personDataPartner1>\n\t\t\t\t<ssk:partnerPersonIdentification>\n\t\t\t\t\t<ssk:officialName>Mustermann</ssk:officialName>\n\t\t\t\t\t<ssk:firstName>Max</ssk:firstName>\n\t\t\t\t\t<ssk:vn>7564945010782</ssk:vn>\n\t\t\t\t\t<ssk:otherPersonId>\n\t\t\t\t\t\t<ech44:personIdCategory>MU.21.pid</ech44:personIdCategory>\n\t\t\t\t\t\t<ech44:personId>123456</ech44:personId>\n\t\t\t\t\t</ssk:otherPersonId>\n\t\t\t\t</ssk:partnerPersonIdentification>\n\t\t\t\t<ssk:addressInformation>\n\t\t\t\t\t<ech46:postalAddress>\n\t\t\t\t\t\t<ech10:addressInformation>\n\t\t\t\t\t\t\t<ech10:street>Musterstrasse</ech10:street>\n\t\t\t\t\t\t\t<ech10:houseNumber>15</ech10:houseNumber>\n\t\t\t\t\t\t\t<ech10:town>Zurich</ech10:town>\n\t\t\t\t\t\t\t<ech10:swissZipCode>8001</ech10:swissZipCode>\n\t\t\t\t\t\t</ech10:addressInformation>\n\t\t\t\t\t</ech46:postalAddress>\n\t\t\t\t</ssk:addressInformation>\n\t\t\t\t<ssk:maritalStatusTax>\n\t\t\t\t\t<ech11:maritalStatus>2</ech11:maritalStatus>\n\t\t\t\t</ssk:maritalStatusTax>\n\t\t\t\t<ssk:religion>711</ssk:religion>\n\t\t\t\t<ssk:paymentPension>false</ssk:paymentPension>\n\t\t\t\t<ssk:taxMunicipality>\n\t\t\t\t\t<ech07:municipalityId>21</ech07:municipalityId>\n\t\t\t\t\t<ech07:municipalityName>Adlikon</ech07:municipalityName>\n\t\t\t\t</ssk:taxMunicipality>\n\t\t\t</ssk:personDataPartner1>\n\t\t\t<ssk:personDataPartner2>\n\t\t\t\t<ssk:personIdentification>\n\t\t\t\t\t<ech44:officialName>Musterfrau</ech44:officialName>\n\t\t\t\t\t<ech44:firstName>Tamara</ech44:firstName>\n\t\t\t\t</ssk:personIdentification>\n\t\t\t\t<ssk:religion>711</ssk:religion>\n\t\t\t\t<ssk:paymentPension>false</ssk:paymentPension>\n\t\t\t</ssk:personDataPartner2>\n\t\t\t<ssk:childData>\n\t\t\t\t<ssk:personIdentification>\n\t\t\t\t\t<ech44:officialName>Mustermann</ech44:officialName>\n\t\t\t\t\t<ech44:firstName>Tim</ech44:firstName>\n\t\t\t\t\t<ech44:dateOfBirth>\n\t\t\t\t\t\t<ech44:yearMonthDay>2015-01-01</ech44:yearMonthDay>\n\t\t\t\t\t</ech44:dateOfBirth>\n\t\t\t\t</ssk:personIdentification>\n\t\t\t\t<ssk:cantonExtension>\n\t\t\t\t\t<zh:childDataInhouseExtension>\n\t\t\t\t\t\t<zh:classificationDetail>\n\t\t\t\t\t\t\t<zh:mutualChildCouple>true</zh:mutualChildCouple>\n\t\t\t\t\t\t</zh:classificationDetail>\n\t\t\t\t\t</zh:childDataInhouseExtension>\n\t\t\t\t\t<ssk:canton>ZH</ssk:canton>\n\t\t\t\t</ssk:cantonExtension>\n\t\t\t\t<ssk:homeOrExternal>false</ssk:homeOrExternal>\n\t\t\t\t<ssk:alimonyOtherPerson>false</ssk:alimonyOtherPerson>\n\t\t\t</ssk:childData>\n\t\t\t<ssk:childData>\n\t\t\t\t<ssk:personIdentification>\n\t\t\t\t\t<ech44:officialName>Musterfrau</ech44:officialName>\n\t\t\t\t\t<ech44:firstName>Noel</ech44:firstName>\n\t\t\t\t\t<ech44:dateOfBirth>\n\t\t\t\t\t\t<ech44:yearMonthDay>2017-01-02</ech44:yearMonthDay>\n\t\t\t\t\t</ech44:dateOfBirth>\n\t\t\t\t</ssk:personIdentification>\n\t\t\t\t<ssk:cantonExtension>\n\t\t\t\t\t<zh:childDataInhouseExtension>\n\t\t\t\t\t\t<zh:classificationDetail>\n\t\t\t\t\t\t\t<zh:mutualChildCouple>true</zh:mutualChildCouple>\n\t\t\t\t\t\t</zh:classificationDetail>\n\t\t\t\t\t</zh:childDataInhouseExtension>\n\t\t\t\t\t<ssk:canton>ZH</ssk:canton>\n\t\t\t\t</ssk:cantonExtension>\n\t\t\t\t<ssk:homeOrExternal>false</ssk:homeOrExternal>\n\t\t\t\t<ssk:alimonyOtherPerson>false</ssk:alimonyOtherPerson>\n\t\t\t</ssk:childData>\n\t\t\t<ssk:revenue>\n\t\t\t\t<ssk:employedMainRevenue>\n\t\t\t\t\t<ssk:partnerAmount1>63250</ssk:partnerAmount1>\n\t\t\t\t\t<ssk:partnerAmount2>72150</ssk:partnerAmount2>\n\t\t\t\t</ssk:employedMainRevenue>\n\t\t\t\t<ssk:employedSidelineRevenue>\n\t\t\t\t\t<ssk:partnerAmount1>5000</ssk:partnerAmount1>\n\t\t\t\t\t<ssk:partnerAmount2>6500</ssk:partnerAmount2>\n\t\t\t\t</ssk:employedSidelineRevenue>\n\t\t\t\t<ssk:cantonExtension>\n\t\t\t\t\t<zh:revenueExtension>\n\t\t\t\t\t\t<zh:employedMainRevenueDetailP1>\n\t\t\t\t\t\t\t<zh:beginDate>2020-01-01</zh:beginDate>\n\t\t\t\t\t\t\t<zh:endDate>2020-12-31</zh:endDate>\n\t\t\t\t\t\t\t<zh:entrepreneur>Musterfirma</zh:entrepreneur>\n\t\t\t\t\t\t\t<zh:revenue>63250</zh:revenue>\n\t\t\t\t\t\t</zh:employedMainRevenueDetailP1>\n\t\t\t\t\t\t<zh:employedMainRevenueDetailP2>\n\t\t\t\t\t\t\t<zh:beginDate>2020-01-01</zh:beginDate>\n\t\t\t\t\t\t\t<zh:endDate>2020-12-31</zh:endDate>\n\t\t\t\t\t\t\t<zh:entrepreneur>Musterfirma 2</zh:entrepreneur>\n\t\t\t\t\t\t\t<zh:revenue>72150</zh:revenue>\n\t\t\t\t\t\t</zh:employedMainRevenueDetailP2>\n\t\t\t\t\t\t<zh:employedSidelineRevenueDetailP1>\n\t\t\t\t\t\t\t<zh:beginDate>2020-01-01</zh:beginDate>\n\t\t\t\t\t\t\t<zh:endDate>2020-12-31</zh:endDate>\n\t\t\t\t\t\t\t<zh:description>Testfirma A</zh:description>\n\t\t\t\t\t\t\t<zh:revenue>5000</zh:revenue>\n\t\t\t\t\t\t</zh:employedSidelineRevenueDetailP1>\n\t\t\t\t\t\t<zh:employedSidelineRevenueDetailP2>\n\t\t\t\t\t\t\t<zh:beginDate>2020-01-01</zh:beginDate>\n\t\t\t\t\t\t\t<zh:endDate>2020-12-31</zh:endDate>\n\t\t\t\t\t\t\t<zh:description>Testfirma B</zh:description>\n\t\t\t\t\t\t\t<zh:revenue>6500</zh:revenue>\n\t\t\t\t\t\t</zh:employedSidelineRevenueDetailP2>\n\t\t\t\t\t\t<zh:relevantCooperationMainP1>false</zh:relevantCooperationMainP1>\n\t\t\t\t\t\t<zh:relevantCooperationMainP2>false</zh:relevantCooperationMainP2>\n\t\t\t\t\t\t<zh:relevantCooperationSidelineP1>false</zh:relevantCooperationSidelineP1>\n\t\t\t\t\t\t<zh:relevantCooperationSidelineP2>false</zh:relevantCooperationSidelineP2>\n\t\t\t\t\t</zh:revenueExtension>\n\t\t\t\t\t<ssk:canton>ZH</ssk:canton>\n\t\t\t\t</ssk:cantonExtension>\n\t\t\t\t<ssk:securitiesRevenue>\n\t\t\t\t\t<ssk:cantonalTax>0</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>0</ssk:federalTax>\n\t\t\t\t</ssk:securitiesRevenue>\n\t\t\t\t<ssk:totalAmountRevenue>\n\t\t\t\t\t<ssk:cantonalTax>146900</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>146900</ssk:federalTax>\n\t\t\t\t</ssk:totalAmountRevenue>\n\t\t\t</ssk:revenue>\n\t\t\t<ssk:deduction>\n\t\t\t\t<ssk:jobExpensesPartner1>\n\t\t\t\t\t<ssk:cantonalTax>5100</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>5100</ssk:federalTax>\n\t\t\t\t</ssk:jobExpensesPartner1>\n\t\t\t\t<ssk:jobExpensesPartner2>\n\t\t\t\t\t<ssk:cantonalTax>5565</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>5565</ssk:federalTax>\n\t\t\t\t</ssk:jobExpensesPartner2>\n\t\t\t\t<ssk:insuranceAndInterest>\n\t\t\t\t\t<ssk:cantonalTax>8000</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>6650</ssk:federalTax>\n\t\t\t\t</ssk:insuranceAndInterest>\n\t\t\t\t<ssk:employmentBothPartner>\n\t\t\t\t\t<ssk:cantonalTax>5900</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>13400</ssk:federalTax>\n\t\t\t\t</ssk:employmentBothPartner>\n\t\t\t\t<ssk:totalAmountDeduction>\n\t\t\t\t\t<ssk:cantonalTax>24565</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>30715</ssk:federalTax>\n\t\t\t\t</ssk:totalAmountDeduction>\n\t\t\t</ssk:deduction>\n\t\t\t<ssk:revenueCalculation>\n\t\t\t\t<ssk:totalAmountRevenue>\n\t\t\t\t\t<ssk:cantonalTax>146900</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>146900</ssk:federalTax>\n\t\t\t\t</ssk:totalAmountRevenue>\n\t\t\t\t<ssk:totalAmountDeduction>\n\t\t\t\t\t<ssk:cantonalTax>24565</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>30715</ssk:federalTax>\n\t\t\t\t</ssk:totalAmountDeduction>\n\t\t\t\t<ssk:netIncome>\n\t\t\t\t\t<ssk:cantonalTax>122335</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>116185</ssk:federalTax>\n\t\t\t\t</ssk:netIncome>\n\t\t\t\t<ssk:adjustedNetIncome>\n\t\t\t\t\t<ssk:cantonalTax>122335</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>116185</ssk:federalTax>\n\t\t\t\t</ssk:adjustedNetIncome>\n\t\t\t\t<ssk:socialDeductionHomeChild>\n\t\t\t\t\t<ssk:cantonalTax>18000</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>13000</ssk:federalTax>\n\t\t\t\t</ssk:socialDeductionHomeChild>\n\t\t\t\t<ssk:socialDeductionPartner>\n\t\t\t\t\t<ssk:federalTax>2600</ssk:federalTax>\n\t\t\t\t</ssk:socialDeductionPartner>\n\t\t\t\t<ssk:totalAmountFiscalRevenue>\n\t\t\t\t\t<ssk:cantonalTax>104335</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>100585</ssk:federalTax>\n\t\t\t\t</ssk:totalAmountFiscalRevenue>\n\t\t\t\t<ssk:resultingFiscalRevenue>\n\t\t\t\t\t<ssk:cantonalTax>104335</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>100585</ssk:federalTax>\n\t\t\t\t</ssk:resultingFiscalRevenue>\n\t\t\t</ssk:revenueCalculation>\n\t\t\t<ssk:asset>\n\t\t\t\t<ssk:totalAmountFiscalAssets>\n\t\t\t\t\t<ssk:fiscalValue>0</ssk:fiscalValue>\n\t\t\t\t</ssk:totalAmountFiscalAssets>\n\t\t\t\t<ssk:resultingFiscalAssets>\n\t\t\t\t\t<ssk:fiscalValue>0</ssk:fiscalValue>\n\t\t\t\t</ssk:resultingFiscalAssets>\n\t\t\t</ssk:asset>\n\t\t\t<ssk:attachedForms>\n\t\t\t\t<ssk:attachedPcTaxDeclaration>true</ssk:attachedPcTaxDeclaration>\n\t\t\t\t<ssk:attachedListOfAssets>true</ssk:attachedListOfAssets>\n\t\t\t\t<ssk:attachedWageStatement>true</ssk:attachedWageStatement>\n\t\t\t\t<ssk:attachedColumn3a>false</ssk:attachedColumn3a>\n\t\t\t\t<ssk:attachedExpenses>true</ssk:attachedExpenses>\n\t\t\t\t<ssk:locationAndDate>Zurich, 09.06.2021</ssk:locationAndDate>\n\t\t\t</ssk:attachedForms>\n\t\t\t<ssk:lastTaxDeclaration>\n\t\t\t\t<ech07:municipalityName>Adlikon</ech07:municipalityName>\n\t\t\t</ssk:lastTaxDeclaration>\n\t\t</ssk:mainForm>\n\t\t<ssk:listOfSecurities>\n\t\t\t<ssk:locationAndDate>Zurich, 09.06.2021</ssk:locationAndDate>\n\t\t\t<ssk:attachedPCListOfSecurities>1</ssk:attachedPCListOfSecurities>\n\t\t\t<ssk:totalGrossRevenue>\n\t\t\t\t<ssk:cantonalTax>0</ssk:cantonalTax>\n\t\t\t\t<ssk:federalTax>0</ssk:federalTax>\n\t\t\t</ssk:totalGrossRevenue>\n\t\t\t<ssk:withholdingTax>0</ssk:withholdingTax>\n\t\t</ssk:listOfSecurities>\n\t\t<ssk:jobExpenses>\n\t\t\t<ssk:jobExpensePartner1>\n\t\t\t\t<ssk:detailsMotorvehicle>\n\t\t\t\t\t<ssk:cantonExtension>\n\t\t\t\t\t\t<zh:carOrMotorbikeExtension>\n\t\t\t\t\t\t\t<zh:isCopiedRow>false</zh:isCopiedRow>\n\t\t\t\t\t\t</zh:carOrMotorbikeExtension>\n\t\t\t\t\t\t<ssk:canton>ZH</ssk:canton>\n\t\t\t\t\t</ssk:cantonExtension>\n\t\t\t\t\t<ssk:numberOfWorkdays>240</ssk:numberOfWorkdays>\n\t\t\t\t</ssk:detailsMotorvehicle>\n\t\t\t\t<ssk:detailsMotorvehicle>\n\t\t\t\t\t<ssk:cantonExtension>\n\t\t\t\t\t\t<zh:carOrMotorbikeExtension>\n\t\t\t\t\t\t\t<zh:isCopiedRow>false</zh:isCopiedRow>\n\t\t\t\t\t\t</zh:carOrMotorbikeExtension>\n\t\t\t\t\t\t<ssk:canton>ZH</ssk:canton>\n\t\t\t\t\t</ssk:cantonExtension>\n\t\t\t\t\t<ssk:numberOfWorkdays>240</ssk:numberOfWorkdays>\n\t\t\t\t</ssk:detailsMotorvehicle>\n\t\t\t\t<ssk:detailsMotorvehicleBusiness>\n\t\t\t\t\t<ssk:numberOfWorkdays>240</ssk:numberOfWorkdays>\n\t\t\t\t</ssk:detailsMotorvehicleBusiness>\n\t\t\t\t<ssk:detailsMotorvehicleBusiness>\n\t\t\t\t\t<ssk:numberOfWorkdays>240</ssk:numberOfWorkdays>\n\t\t\t\t</ssk:detailsMotorvehicleBusiness>\n\t\t\t\t<ssk:cateringSubsidized>\n\t\t\t\t\t<ssk:cantonalTax>1600</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>1600</ssk:federalTax>\n\t\t\t\t</ssk:cateringSubsidized>\n\t\t\t\t<ssk:remainingJobCostFlatrate>\n\t\t\t\t\t<ssk:cantonalTax>2000</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>2000</ssk:federalTax>\n\t\t\t\t</ssk:remainingJobCostFlatrate>\n\t\t\t\t<ssk:furtherEducationFlatrate>\n\t\t\t\t\t<ssk:cantonalTax>500</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>500</ssk:federalTax>\n\t\t\t\t</ssk:furtherEducationFlatrate>\n\t\t\t\t<ssk:sidelineFlatrate>\n\t\t\t\t\t<ssk:cantonalTax>1000</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>1000</ssk:federalTax>\n\t\t\t\t</ssk:sidelineFlatrate>\n\t\t\t\t<ssk:totalAmountJobExpenses>\n\t\t\t\t\t<ssk:cantonalTax>5100</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>5100</ssk:federalTax>\n\t\t\t\t</ssk:totalAmountJobExpenses>\n\t\t\t\t<ssk:placeOfWorkAddress>Paradeplatz</ssk:placeOfWorkAddress>\n\t\t\t</ssk:jobExpensePartner1>\n\t\t\t<ssk:jobExpensePartner2>\n\t\t\t\t<ssk:detailsMotorvehicle>\n\t\t\t\t\t<ssk:cantonExtension>\n\t\t\t\t\t\t<zh:carOrMotorbikeExtension>\n\t\t\t\t\t\t\t<zh:isCopiedRow>false</zh:isCopiedRow>\n\t\t\t\t\t\t</zh:carOrMotorbikeExtension>\n\t\t\t\t\t\t<ssk:canton>ZH</ssk:canton>\n\t\t\t\t\t</ssk:cantonExtension>\n\t\t\t\t\t<ssk:numberOfWorkdays>240</ssk:numberOfWorkdays>\n\t\t\t\t</ssk:detailsMotorvehicle>\n\t\t\t\t<ssk:detailsMotorvehicle>\n\t\t\t\t\t<ssk:cantonExtension>\n\t\t\t\t\t\t<zh:carOrMotorbikeExtension>\n\t\t\t\t\t\t\t<zh:isCopiedRow>false</zh:isCopiedRow>\n\t\t\t\t\t\t</zh:carOrMotorbikeExtension>\n\t\t\t\t\t\t<ssk:canton>ZH</ssk:canton>\n\t\t\t\t\t</ssk:cantonExtension>\n\t\t\t\t\t<ssk:numberOfWorkdays>240</ssk:numberOfWorkdays>\n\t\t\t\t</ssk:detailsMotorvehicle>\n\t\t\t\t<ssk:detailsMotorvehicleBusiness>\n\t\t\t\t\t<ssk:numberOfWorkdays>240</ssk:numberOfWorkdays>\n\t\t\t\t</ssk:detailsMotorvehicleBusiness>\n\t\t\t\t<ssk:detailsMotorvehicleBusiness>\n\t\t\t\t\t<ssk:numberOfWorkdays>240</ssk:numberOfWorkdays>\n\t\t\t\t</ssk:detailsMotorvehicleBusiness>\n\t\t\t\t<ssk:cateringSubsidized>\n\t\t\t\t\t<ssk:cantonalTax>1600</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>1600</ssk:federalTax>\n\t\t\t\t</ssk:cateringSubsidized>\n\t\t\t\t<ssk:remainingJobCostFlatrate>\n\t\t\t\t\t<ssk:cantonalTax>2165</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>2165</ssk:federalTax>\n\t\t\t\t</ssk:remainingJobCostFlatrate>\n\t\t\t\t<ssk:furtherEducationFlatrate>\n\t\t\t\t\t<ssk:cantonalTax>500</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>500</ssk:federalTax>\n\t\t\t\t</ssk:furtherEducationFlatrate>\n\t\t\t\t<ssk:sidelineFlatrate>\n\t\t\t\t\t<ssk:cantonalTax>1300</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>1300</ssk:federalTax>\n\t\t\t\t</ssk:sidelineFlatrate>\n\t\t\t\t<ssk:totalAmountJobExpenses>\n\t\t\t\t\t<ssk:cantonalTax>5565</ssk:cantonalTax>\n\t\t\t\t\t<ssk:federalTax>5565</ssk:federalTax>\n\t\t\t\t</ssk:totalAmountJobExpenses>\n\t\t\t\t<ssk:placeOfWorkAddress>Bahnhofstrasse</ssk:placeOfWorkAddress>\n\t\t\t</ssk:jobExpensePartner2>\n\t\t</ssk:jobExpenses>\n\t\t<ssk:insurancePremiums>\n\t\t\t<ssk:deductionInsuranceAndInterestMarried>\n\t\t\t\t<ssk:cantonalTax>7800</ssk:cantonalTax>\n\t\t\t\t<ssk:federalTax>5250</ssk:federalTax>\n\t\t\t</ssk:deductionInsuranceAndInterestMarried>\n\t\t\t<ssk:deductionChild>\n\t\t\t\t<ssk:cantonalTax>2600</ssk:cantonalTax>\n\t\t\t\t<ssk:federalTax>1400</ssk:federalTax>\n\t\t\t</ssk:deductionChild>\n\t\t\t<ssk:totalDeductionInsuranceAndInterest>\n\t\t\t\t<ssk:cantonalTax>10400</ssk:cantonalTax>\n\t\t\t\t<ssk:federalTax>6650</ssk:federalTax>\n\t\t\t</ssk:totalDeductionInsuranceAndInterest>\n\t\t\t<ssk:finalDeduction>\n\t\t\t\t<ssk:cantonalTax>8000</ssk:cantonalTax>\n\t\t\t\t<ssk:federalTax>6650</ssk:federalTax>\n\t\t\t</ssk:finalDeduction>\n\t\t\t<ssk:privateHealthInsurance>8000</ssk:privateHealthInsurance>\n\t\t\t<ssk:subtotalAmount>8000</ssk:subtotalAmount>\n\t\t\t<ssk:paidInsuranceAndInterest>8000</ssk:paidInsuranceAndInterest>\n\t\t\t<ssk:deductionChildNumber>2</ssk:deductionChildNumber>\n\t\t</ssk:insurancePremiums>\n\t</ssk:content>\n</ssk:message>", "format": "PDF_417", "sources": [0, 1, 2, 3]}]};

  return (
    <div className={css.document}>
      {status === 'pending' && <Loading />}

      {status === 'success' && (
        <>
          <div className={css.tabWrapper}>
            <Tabs
              isTrackTab={false}
              selected={tab}
              track={track}
              onSelectTab={selectTab}
              items={[
                { id: 'search', title: 'Preview' },
                { id: 'text', title: 'Raw Text' },
                { id: 'kv', title: `Key-Value Pairs` },
                { id: 'tables', title: `Tables` },
                { id: 'entities', title: `Entities` },
                { id: 'medical_entities', title: `Medical Entities` },
                { id: 'barcodes', title: `Barcodes` },
              ]}
            />


            {track === 'redaction' &&
            document.redactions &&
            Object.keys(document.redactions).length ? (
              <div className={css.downloadButtons}>
                <Button inverted onClick={clearReds}>
                  Clear Redaction
                </Button>
                <Button className={css.downloadRedacted} onClick={downloadRedacted}>
                ⬇ Redacted Doc
                </Button>
              </div>
            ) : null}




              <div>

              <Tabs
              isTrackTab={true}
              selected={trackTab}
              track={track}
              onSelectTab={selectTrack}
              items={[
                { id: 'searchTrack', title: 'Discovery'},
                { id: 'complianceTrack', title: 'Compliance'},
                { id: 'workflowTrack', title: 'Workflow Automation'}
              ]}
            />
            </div>
          </div>
          <div className={cs(css.searchBarWrapper, tab === 'search' && css.visible)}>
            <DocumentSearchBar className={css.searchBar} placeholder="Search current document…" />
            {track === 'redaction' ? <Button onClick={redactMatches}>Redact matches</Button> : null}
          </div>
          <div className={css.content} ref={contentRef}>
            <DocumentViewer
              className={cs(
                css.tabSourceViewer,
                tab === 'kv' && css.withKv,
                tab === 'entities' && css.withEv,
                tab === 'medical_entities' && css.withEv,
                tab === 'text' && css.withText,
                tab === 'barcodes' && css.withKv

              )}
              document={document}
              pageCount={pageCount}
              redactions={(document.redactions || {})[currentPageNumber]}
              marks={
                tab === 'search'
                  ? wordsMatchingSearch
                  : tab === 'text'
                  ? pageLinesAsMarks
                  : tab === 'kv'
                  ? pagePairsAsMarks
                  : tab === 'entities'
                  ? (document.highlights || [])
                  : tab === 'medical_entities'
                  ? (document.highlights || [])
                  : []
              }
              tables={tab === 'tables' && pageData.tables}
              highlightedMark={highlightedKv}
            />

            <div
              className={cs(
                css.sidebar,
                (tab === 'kv' || tab === 'text' || tab === 'entities' || tab ==='medical_entities' || tab === 'search' ||tab === 'text'||tab === 'tables'||tab === 'barcodes') && css.visible
              )}
            >
              <KeyValueList
                kvPairs={docData.pairs}
                pageCount={pageCount}
                currentPageNumber={currentPageNumber}
                showRedaction={track === 'redaction'}
                onHighlight={setHighlightedKv}
                onSwitchPage={switchPage}
                onRedact={redact}
                onRedactAll={redactAllValues}
                onDownload={downloadKV}
                visible={tab === 'kv'}
              />

              <DocumentPreview
                document={document}
                pageCount={pageCount}
                visible={tab === 'search'}
                track = {track}
              />

              <RawTextLines
                lines={docData.lines}
                pageCount={pageCount}
                currentPageNumber={currentPageNumber}
                onHighlight={setHighlightedLine}
                onSwitchPage={switchPage}
                visible={tab === 'text'}
              />

              <EntitiesCheckbox
                 entities={docData.entities}
                 pageCount={pageCount}
                 currentPageNumber={currentPageNumber}
                 showRedaction={track === 'redaction'}
                 onHighlight={highlightEntities}
                 onSwitchPage={switchPage}
                 onRedact={redactEntityMatches}
                 onRedactAll={redactAllValues}
                 onDownload={downloadKV}
                 visible={tab === 'entities'}
                 comprehendService={COMPREHEND_SERVICE}
                 onDownloadPrimary = {downloadEntities}
                 onDownloadSecondary = {null}
                 document = {document}
              />

              <EntitiesCheckbox
                 entities={docData.medicalEntities}
                 pageCount={pageCount}
                 currentPageNumber={currentPageNumber}
                 showRedaction={track === 'redaction'}
                 onHighlight={highlightEntities}
                 onSwitchPage={switchPage}
                 onRedact={redactEntityMatches}
                 onRedactAll={redactAllValues}
                 onDownloadPrimary={downloadMedicalEntities}
                 onDownloadSecondary = {downloadMedicalICD10Ontologies}
                 visible={tab === 'medical_entities'}
                 comprehendService={COMPREHEND_MEDICAL_SERVICE}
                 document = {document}
              />

              <TableResults
                 tables={docData.tables}
                 pageCount={pageCount}
                 currentPageNumber={currentPageNumber}
                 onSwitchPage={switchPage}
                 visible={tab === 'tables'}
                 document = {document}
              />

              <BarcodeResults
                  barcodes={docData.barcodes}
                  pageCount={pageCount}
                  currentPageNumber={currentPageNumber}
                  onSwitchPage={switchPage}
                  visible={tab === 'barcodes'}
                  document = {document}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default connect(function mapStateToProps(state) {
  const { id } = queryString.parse(location.search)

  return {
    id,
    currentPageNumber: getCurrentPageNumber(state, id),
    document: getDocumentById(state, id),
    searchQuery: getDocumentSearchQuery(state),
    track: getSelectedTrackId(state),
  }
})(Document)

/**
 * Conditionally fetch documents from the client side.
 *
 * @param {Function} dispatch Redux dispatch function
 * @param {Array} documents An array of documents
 * @param {Boolean} isDocumentFetched True if the document has already been fetched
 */
function useFetchDocument(dispatch, id, isDocumentFetched) {
  const isMounted = useRef(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!isDocumentFetched) {
      isMounted.current && setStatus('pending')

      dispatch(fetchDocument(id))
        .then(meta => {
          isMounted.current && setStatus('success')
        })
        .catch(() => {
          isMounted.current && setStatus('error')
        })
    } else {
      isMounted.current && setStatus('success')
    }
  }, [dispatch, id, isDocumentFetched])

  // Ensure we don't try to set state after component unmount
  useEffect(() => () => (isMounted.current = false), [])

  return { status }
}
